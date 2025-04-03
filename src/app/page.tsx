"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [stats, setStats] = useState({
    artworks: 0,
    cities: 0,
    themes: 0,
  });
  
  const [isVisible, setIsVisible] = useState({
    stats: false,
    about: false,
    features: false,
    cta: false,
  });
  
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Fetch stats on component mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/get_all");
        const data = await response.json();
        
        if (data.artworks && Array.isArray(data.artworks)) {
          // Count unique cities
          const cities = new Set();
          const themes = new Set();
          
          data.artworks.forEach((art: any) => {
            if (art.location && art.location.city) {
              cities.add(art.location.city.toLowerCase());
            }
            
            if (art.themes && Array.isArray(art.themes)) {
              art.themes.forEach((theme: string) => themes.add(theme));
            }
          });
          
          setStats({
            artworks: data.artworks.length,
            cities: cities.size,
            themes: themes.size,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }
    
    fetchStats();
  }, []);
  
  // Intersection observer for animations
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.25,
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === statsRef.current && entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, stats: true }));
        } else if (entry.target === aboutRef.current && entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, about: true }));
        } else if (entry.target === featuresRef.current && entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, features: true }));
        } else if (entry.target === ctaRef.current && entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, cta: true }));
        }
      });
    }, options);
    
    if (statsRef.current) observer.observe(statsRef.current);
    if (aboutRef.current) observer.observe(aboutRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-white overflow-hidden">
        {/* Background with animated gradients */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-indigo-900 via-violet-900 to-purple-900">
          {/* Animated patterns */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-indigo-600/30 animate-pulse"></div>
            <div className="absolute top-3/4 left-1/3 w-40 h-40 rounded-full bg-purple-500/20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full bg-blue-500/30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-pink-500/20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          </div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'white\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")'
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            <span className="block animate-slide-in-bottom" style={{ animationDelay: '0.3s' }}>Discover Street Art</span>
            <span className="block text-indigo-300 animate-slide-in-bottom" style={{ animationDelay: '0.6s' }}>Around the World</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-2xl mb-12 text-gray-200 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            Explore urban art that tells stories, challenges perspectives, and transforms public spaces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '1.2s' }}>
            <Link href="/map" className="btn-primary py-3 px-8 rounded-lg text-lg font-medium flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Explore Map
            </Link>
            <a 
              href="#about" 
              className="group border-2 border-white hover:bg-white hover:text-indigo-900 text-white py-3 px-8 rounded-lg text-lg font-medium transition-all duration-300 flex items-center justify-center overflow-hidden relative"
            >
              <span className="relative z-10">Learn More</span>
              <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </a>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <a href="#stats" className="block text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>
      
      {/* Stats Section */}
      <section id="stats" ref={statsRef} className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { 
                title: 'Artworks', 
                value: stats.artworks, 
                color: 'from-indigo-500 to-indigo-700',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              { 
                title: 'Cities', 
                value: stats.cities, 
                color: 'from-violet-500 to-purple-700',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )
              },
              { 
                title: 'Themes', 
                value: stats.themes, 
                color: 'from-blue-500 to-blue-700',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                )
              }
            ].map((stat, index) => (
              <div 
                key={stat.title}
                className={`bg-gradient-to-br ${stat.color} rounded-xl py-8 px-6 text-white shadow-xl hover-lift transform transition-all duration-300 ${
                  isVisible.stats 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {stat.icon}
                <div className="text-5xl font-bold mb-1">
                  {/* Simple counter animation */}
                  {isVisible.stats ? stat.value : 0}
                </div>
                <div className="text-xl">{stat.title}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-100 rounded-full opacity-70"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-purple-100 rounded-full opacity-70"></div>
      </section>
      
      {/* About Section */}
      <section id="about" ref={aboutRef} className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div 
            className={`max-w-3xl mx-auto text-center mb-20 transition-all duration-700 transform ${
              isVisible.about ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-900 relative inline-block">
              About Artivism
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-indigo-600"></span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Artivism combines art and activism to create social change and raise awareness about important issues. 
              Our platform maps street art, murals, and public installations that tell powerful stories and inspire communities.
            </p>
          </div>
          
          <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Explore Cities",
                description: "Discover urban art in cities around the world, from famous murals to hidden gems in unexpected places.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                color: "indigo",
                delay: 0
              },
              {
                title: "Explore Themes",
                description: "Filter artworks by themes like social justice, environment, cultural heritage, and much more.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                ),
                color: "purple",
                delay: 200
              },
              {
                title: "Create Tours",
                description: "Plan and save your own street art tours to visit in person or share with friends.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: "blue",
                delay: 400
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`group bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-500 relative art-card overflow-hidden 
                transform ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${feature.delay}ms` }}
              >
                <div className={`text-${feature.color}-600 mb-6 relative z-10 transform transition-transform duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                
                {/* Background decorative element */}
                <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full bg-${feature.color}-100 opacity-0 group-hover:opacity-70 transition-opacity duration-300`}></div>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-900 relative z-10">{feature.title}</h3>
                <p className="text-gray-700 relative z-10 group-hover:text-gray-800 transition-colors duration-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234f46e5' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 5v1H5V0zm1 5v1H5v-1h1z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '12px 12px'
        }}></div>
      </section>
      
      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-violet-800 to-purple-800"></div>
        
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-indigo-700 mix-blend-overlay opacity-60"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-purple-700 mix-blend-overlay opacity-70"></div>
        </div>
        
        <div 
          className={`container mx-auto px-6 text-center relative z-10 text-white transform transition-all duration-700 ${
            isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-4xl font-bold mb-8">Ready to explore street art?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-12 text-indigo-100">
            Discover urban art and activism that's transforming public spaces around the world.
          </p>
          <Link href="/map" className="group bg-white text-indigo-800 hover:bg-indigo-100 py-4 px-10 rounded-full text-lg font-medium transition-all duration-300 inline-flex items-center transform hover:scale-105 hover:shadow-lg">
            Start Exploring
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-10 md:mb-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <svg viewBox="0 0 24 24" className="h-8 w-8 mr-3 text-indigo-500" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.42 4.58C19.99 4.15 19.41 3.9 18.83 3.9H18.12L16.19 2.5C15.11 1.73 13.85 1.3 12.5 1.3C11.18 1.3 9.89 1.73 8.81 2.5L6.88 3.9H6.17C5.58 3.9 5.01 4.15 4.58 4.58C4.14 5.01 3.9 5.58 3.9 6.17V18.83C3.9 20.07 4.9 21.09 6.14 21.1H18.85C20.1 21.09 21.1 20.07 21.1 18.83V6.17C21.1 5.58 20.85 5.01 20.42 4.58ZM8.5 5.7L11.6 3.46L13.4 3.46L16.5 5.7L12.5 9L8.5 5.7ZM12.5 12.73C11.56 12.73 10.8 11.97 10.8 11.03C10.8 10.08 11.56 9.33 12.5 9.33C13.44 9.33 14.2 10.08 14.2 11.03C14.2 11.97 13.44 12.73 12.5 12.73Z"/>
                </svg>
                <h2 className="text-2xl font-bold text-white">Artivism</h2>
              </div>
              <p className="mt-2 max-w-md mx-auto md:mx-0">Mapping art that makes a difference. Discover street art and public installations that inspire social change.</p>
              
              <div className="mt-4 flex justify-center md:justify-start space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-16">
              <div className="mb-8 md:mb-0">
                <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
                <ul className="space-y-2">
                  <li><Link href="/" className="hover:text-white transition-colors duration-300 block">Home</Link></li>
                  <li><Link href="/map" className="hover:text-white transition-colors duration-300 block">Map</Link></li>
                  <li><Link href="/tours" className="hover:text-white transition-colors duration-300 block">Tours</Link></li>
                  <li><a href="#about" className="hover:text-white transition-colors duration-300 block">About</a></li>
                </ul>
              </div>
              <div className="mb-8 md:mb-0">
                <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors duration-300 block">Documentation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors duration-300 block">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors duration-300 block">API</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Artivism. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Add the missing CSS animations
const createCSSAnimations = () => {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slide-in-bottom {
      0% { transform: translateY(40px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    
    .animate-slide-in-bottom {
      animation: slide-in-bottom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
    }
    
    .animate-fade-in {
      animation: fade-in 1s ease both;
    }
  `;
  document.head.appendChild(style);
};

// Execute on client side
if (typeof window !== 'undefined') {
  createCSSAnimations();
}