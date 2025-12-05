"use client";

import { useState, useEffect } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import { Trash2, Plus, Save } from "lucide-react";

type Slide = {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  color: string;
};

export default function HeroSettingsPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/hero")
      .then((res) => res.json())
      .then((data) => {
        if (data.heroSlides) {
          setSlides(data.heroSlides);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddSlide = () => {
    setSlides([
      ...slides,
      {
        image: "",
        title: "New Slide",
        subtitle: "Description goes here",
        ctaText: "Shop Now",
        ctaLink: "/collections",
        color: "#f3f4f6",
      },
    ]);
  };

  const handleRemoveSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const handleUpdateSlide = (
    index: number,
    field: keyof Slide,
    value: string
  ) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const handleSave = async () => {
    // Validate slides
    const invalidSlides = slides.filter((slide) => !slide.image);
    if (invalidSlides.length > 0) {
      alert("Please upload an image for all slides before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroSlides: slides }),
      });
      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        const data = await res.json();
        alert(`Failed to save settings: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hero Carousel Settings
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-700">Slide {index + 1}</h3>
              <button
                onClick={() => handleRemoveSlide(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Image
                </label>
                {slide.image ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                    <Image
                      src={slide.image}
                      alt="Slide"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleUpdateSlide(index, "image", "")}
                        className="text-white bg-red-600 px-3 py-1 rounded-md text-sm"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <UploadDropzone
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          handleUpdateSlide(index, "image", res[0].url);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) =>
                      handleUpdateSlide(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) =>
                      handleUpdateSlide(index, "subtitle", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Text
                    </label>
                    <input
                      type="text"
                      value={slide.ctaText}
                      onChange={(e) =>
                        handleUpdateSlide(index, "ctaText", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTA Link
                    </label>
                    <input
                      type="text"
                      value={slide.ctaLink}
                      onChange={(e) =>
                        handleUpdateSlide(index, "ctaLink", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slide.color}
                      onChange={(e) =>
                        handleUpdateSlide(index, "color", e.target.value)
                      }
                      className="h-10 w-10 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={slide.color}
                      onChange={(e) =>
                        handleUpdateSlide(index, "color", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddSlide}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={20} />
          Add New Slide
        </button>
      </div>
    </div>
  );
}
