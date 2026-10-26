# INFO 253A Final Project Proposal

## Team 

We're team 4. 
Team members include Evan Vlahos, Ernest Makaika, Riska Ardilla Putri and Chengyi Zhang. 

## Project Idea
We want to build a fitness logger where users record a completed workout, including what they did, how they felt, and any additional notes. 
The web app will organize entries in a detailed calendar view and a summary dashboard, with filters for browsing past workouts, and will save all data in the browser using `localStorage`. 
We noticed that people are often too tired after working out to type everything in. 
So we plan to integrate an external AI API for voice recognition to make logging easier, so users can describe what they did using speech instead of sitting down to type. 

## External API to use

We plan to use Google Gemmini's `generateContent` API, and we initially plan to use gemmini3.5-flash-lite to keep the cost low and response time fast. 
This API acceptes both text and audio input, which fits our goal of effortless logging. 