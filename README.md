# Hack The Bronx 🌟

## What is Hack The Bronx?

Hack The Bronx is a community-driven web platform that helps connect people in the Bronx with local resources, events, and opportunities. Our goal is to make it easier for Bronx residents to:
- Find and join community events
- Access educational resources
- Connect with local organizations
- Share and discover community initiatives
- Participate in local tech projects

## Main Features

- 📱 Mobile-friendly interface
- 🗺️ Interactive map of community resources
- 📅 Community event calendar
- 💬 Discussion forums
- 📢 Local organization directory
- 🤝 Volunteer opportunity listings

## How to Install and Run the App

### System Requirements
- Node.js version 14 or higher
- npm (comes with Node.js)
- Git

### Step-by-Step Installation

1. Open your terminal/command prompt

2. Clone the project to your computer:
   ```sh
   git clone https://github.com/yourusername/hack_the_bronx.git
   cd hack_the_bronx
   ```

3. Install the required packages:
   ```sh
   npm install
   ```

4. Set up your environment:
   - Create a new file called `.env` in the main folder
   - Add these settings (replace with your actual values):
   ```
   MONGODB_URI=your_database_connection_string
   API_KEY=your_api_key
   ```

5. Start the app:
   ```sh
   npm run dev
   ```

6. Open your web browser and go to:
   ```
   http://localhost:3000
   ```

### Troubleshooting Common Issues

- If you see "port already in use" error:
  - Try using a different port: `npm run dev -- -p 3001`
  
- If packages aren't installing:
  - Try deleting the `node_modules` folder and running `npm install` again
  
- If you get database connection errors:
  - Double-check your `.env` file settings
  - Make sure your database is running

## Want to Help?

We welcome contributions! If you'd like to help improve Hack The Bronx:

1. Fork the project
2. Create your feature branch (`git checkout -b new-feature`)
3. Make your changes
4. Push to your branch (`git push origin new-feature`)
5. Open a Pull Request

## License

This project is under the MIT License - feel free to use, modify, and share! 
Made with ❤️ for the Bronx community 
