import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-black text-white flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 z-10" />
        <div className="relative z-20 text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            About Yuvara
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Redefining luxury footwear for the modern era
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
            <div className="w-24 h-1 bg-black mx-auto mb-8" />
          </div>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Founded with a vision to merge timeless craftsmanship with contemporary design, 
              Yuvara represents the pinnacle of luxury footwear. Each piece in our collection 
              tells a story of dedication, artistry, and uncompromising quality.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Our journey began in the heart of Milan, where tradition meets innovation. 
              We collaborate with master artisans who have honed their craft over generations, 
              ensuring every stitch, every curve, and every detail meets our exacting standards.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, Yuvara stands as a testament to what happens when passion meets precision. 
              We don&apos;t just create shoes; we craft experiences, memories, and statements of 
              individual style that transcend fleeting trends.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Our Values</h2>
            <div className="w-24 h-1 bg-black mx-auto mb-8" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                C
              </div>
              <h3 className="text-2xl font-bold mb-4">Craftsmanship</h3>
              <p className="text-gray-600 leading-relaxed">
                Every pair is meticulously handcrafted by skilled artisans, 
                ensuring unparalleled quality and attention to detail.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                I
              </div>
              <h3 className="text-2xl font-bold mb-4">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                We blend traditional techniques with cutting-edge design, 
                creating footwear that&apos;s both timeless and contemporary.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                S
              </div>
              <h3 className="text-2xl font-bold mb-4">Sustainability</h3>
              <p className="text-gray-600 leading-relaxed">
                We&apos;re committed to ethical sourcing and sustainable practices, 
                ensuring our luxury doesn&apos;t come at the planet&apos;s expense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Experience Yuvara</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover our curated collection of luxury footwear, 
            where every step is a statement.
          </p>
          <Link 
            href="/collections"
            className="inline-block bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-200 transition-colors duration-300"
          >
            Explore Collection
          </Link>
        </div>
      </section>
    </main>
  );
}
