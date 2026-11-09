import { useEffect, useRef, useState } from 'react'
import { extractWorkout, MAX_AUDIO_BYTES } from '../services/gemini.jsx'

function VoiceInput({ apiKey, onDraft, onBusyChange, onOpenSettings }) {
  const [status, setStatus] = useState('idle')
  const [audio, setAudio] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const session = useRef({ active: true, stream: null, recorder: null, request: null, timer: null })
  const busy = status !== 'idle'

  useEffect(() => {
    const current = session.current
    current.active = true
    return () => {
      current.active = false
      clearTimeout(current.timer)
      current.request?.abort()
      if (current.recorder) {
        current.recorder.onstop = null
        current.recorder.ondataavailable = null
        current.recorder.onerror = null
        if (current.recorder.state !== 'inactive') current.recorder.stop()
      }
      current.stream?.getTracks().forEach(track => track.stop())
    }
  }, [])

  useEffect(() => { onBusyChange(busy) }, [busy, onBusyChange])

  useEffect(() => {
    if (!audio) { setAudioUrl(''); return }
    const url = URL.createObjectURL(audio)
    setAudioUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audio])

  function releaseMicrophone() {
    clearTimeout(session.current.timer)
    session.current.stream?.getTracks().forEach(track => track.stop())
    session.current.stream = null
  }

  function stopRecording() {
    if (session.current.recorder?.state === 'recording') {
      setStatus('stopping')
      session.current.recorder.stop()
    }
  }

  async function startRecording() {
    setError('')
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording needs HTTPS or localhost and microphone support. You can upload an audio file instead.')
      return
    }
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!session.current.active) { stream.getTracks().forEach(track => track.stop()); return }
      session.current.stream = stream
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      session.current.recorder = recorder
      const chunks = []
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        releaseMicrophone()
        session.current.recorder = null
        if (!session.current.active) return
        const recording = new Blob(chunks, { type: recorder.mimeType })
        if (!recording.size || recording.size > MAX_AUDIO_BYTES) {
          setError('The recording is empty or too large. Please record a shorter clip.')
        } else {
          setAudio(recording)
        }
        setStatus('idle')
      }
      recorder.onerror = () => {
        recorder.onstop = null
        releaseMicrophone()
        if (recorder.state !== 'inactive') recorder.stop()
        session.current.recorder = null
        if (session.current.active) {
          setError('Recording failed. Try again or upload an audio file.')
          setStatus('idle')
        }
      }
      recorder.start()
      setAudio(null)
      setStatus('recording')
      session.current.timer = setTimeout(stopRecording, 120000)
    } catch (cause) {
      releaseMicrophone()
      if (!session.current.active) return
      setError(cause.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow access or upload an audio file.' : 'Could not start recording. Try again or upload an audio file.')
      setStatus('idle')
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setMessage('')
    if (!file.type.startsWith('audio/') || !file.size || file.size > MAX_AUDIO_BYTES) {
      setError('Choose a non-empty audio file smaller than 10 MB.')
      return
    }
    setAudio(file)
  }

  async function handleExtract() {
    setError('')
    setMessage('')
    setStatus('processing')
    const controller = new AbortController()
    session.current.request = controller
    const timeout = setTimeout(() => controller.abort(), 60000)
    try {
      const today = new Date()
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const draft = await extractWorkout({ audio, apiKey, localDate, signal: controller.signal })
      if (!session.current.active || controller.signal.aborted) return
      onDraft(draft)
      setMessage('Fields filled. Review them, complete any missing details, and save the workout.')
    } catch (cause) {
      if (session.current.active) setError(controller.signal.aborted ? 'The request timed out. Try again.' : cause.message)
    } finally {
      clearTimeout(timeout)
      session.current.request = null
      if (session.current.active) setStatus('idle')
    }
  }

  return (
    <section className="voice-input" aria-label="Voice input">
      {!apiKey ? (
        <button type="button" onClick={onOpenSettings}>Voice input: add API key</button>
      ) : (
        <>
          <button type="button" onClick={status === 'recording' ? stopRecording : startRecording} disabled={busy && status !== 'recording'}>
            {status === 'recording' ? 'Stop recording' : status === 'requesting' ? 'Waiting for microphone…' : 'Voice input: record workout'}
          </button>
          <label>
            Or upload audio (up to 10 MB)
            <input type="file" accept="audio/*" onChange={handleUpload} disabled={busy} />
          </label>
          {audioUrl && <audio src={audioUrl} controls preload="metadata" />}
          {audio && <button type="button" onClick={handleExtract} disabled={busy}>{status === 'processing' ? 'Processing…' : 'Fill form from recording'}</button>}
          <p>Your recording is sent to Google Gemini when you choose “Fill form from recording”. This replaces the fields below; review them before saving.</p>
        </>
      )}
      <p role="status">{status === 'recording' ? 'Recording… Stops automatically after 2 minutes.' : status === 'processing' ? 'Extracting workout details…' : message}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}

export default VoiceInput
