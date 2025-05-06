# Artivism - Street Art Exploration Platform

Artivism is a web application that maps street art and public installations that inspire social change, allowing users to discover and explore urban art around the world.

![Artivism Screenshot](/public/backgroundimage.webp)

## Features

- **Interactive Map**: Explore street art locations on an interactive map
- **Gallery View**: Browse artwork with filters by theme and accessibility requirements
- **Accessibility Features**: Filter art based on wheelchair accessibility, audio descriptions, and more
- **Custom Tours**: Create, save, and optimize tours to visit multiple artworks
- **User Profiles**: Track favorite artworks and saved tours
- **Comprehensive Database**: Search across cities, themes, and artists

## Technologies Used

- **Frontend**: React, Next.js, TailwindCSS
- **Maps**: Leaflet, React-Leaflet
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/Artivism.git
   cd Artivism
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Seed the database with sample data
   ```bash
   node scripts/seed_real_data.js
   ```

5. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app/` - Next.js 13+ app router pages
- `/src/components/` - React components
- `/src/pages/api/` - API routes
- `/src/db/` - Database models and connection
- `/public/` - Static assets
- `/scripts/` - Utility scripts for database operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all the street artists whose work gives life to this platform
- Built with love for CS430 project