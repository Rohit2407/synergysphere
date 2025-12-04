# Synergy Sphere :  Advanced Team Collaboration Platform

## Web Stack/Requirements : 
 - React.js
 - React Native
 - PostgreSQL
 - Backend RESTfulAPI
 - Python

## Functionalities : 
 - User Interface (Tailwind CSS)
 - Sign Up/Login Page (Reflecting in PostgreSQL Database)
 - Dashboard
 - Create Project (Reflects in PostgreSQL Database and in Dashboard)
 - Assign Task within Project (Can choose assignee and due date, Reflects in PostgreSQL Database and in Dashboard)

## Instructions :

1. To run this web/mobile application on your local host - install the zip folder of the entire repositiry
2. Or do a git clone of the entire repositiry
3. This runs on a personal database - PostgreSQL Database
4. Create a database - synergysphere on your PostgreSQL Database with the following command : psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE synergysphere;"
5. Run the schema.sql file given : psql -h localhost -p 5432 -U postgres -d synergysphere -f "\schema.sql"
6. Once installation is done, Inside the .env file, change the password name to the password of your PostgreSQL Host
7. npm run build
8. npm run dev
9. You can run this on the local device by finding the ip of your computer device (cmd->ipconfig->ip4--->ip:PORT)
10. The webpage is now active on the computer and in the mobile device
11. The computer acts as the owner and other devices act as the member
12. Functionalities are explained in the video : https://drive.google.com/file/d/10GQc6cg7kF2zZjKOh8dB_v7xMDKziVk5/view?usp=sharing

#### Video Link  : https://drive.google.com/file/d/10GQc6cg7kF2zZjKOh8dB_v7xMDKziVk5/view?usp=sharing

# About

SynergySphere is a web/mobile application developed by Rohit Raj and Rishi R for the Odoo X NMIT Hackathon 2025. This is licensed under the MIT License.


