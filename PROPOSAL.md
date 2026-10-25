# INFO 253A Final Project Proposal

## Team 

We're team 4. 
Team members include Evan Vlahos, Ernest Makaika, Riska Ardilla Putri and Chengyi Zhang. 

## Project Idea

We plan to work on a fitness logger as our final project. 
The user should enter a completed workout. 
This web application will log and organize the details of each workout, what the user did, how they feel, and any additional notes. 
We plan to provide detailed calendar view, sumamry dashboard, filtering of views, and so on. 
The workout logging data will be persistently stored locally via `localStorage`. 
A key issue is that the user might already to too exhausted after the workout to do a detailed logging. 
To address this limitation, we plan to integrate an external AI API for voice recognition, so the user can describe what they did using speech instead of typing. 
Through this API, the user can effortlessly log a new entry without needing to sit down and type.

## External API to use

We plan to use Google Gemmini's `generateContent` API, and we initially plan to use gemmini3.5-flash-lite to keep the cost low and response time fast. 
This API acceptes both text and audio input, which fits our goal of effortless logging. 