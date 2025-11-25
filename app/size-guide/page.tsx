import React from "react";
import Link from "next/link";

export default function SizeGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Size Guide</h1>
        <p className="text-lg text-gray-600">
          Find your perfect fit with our comprehensive size charts.
        </p>
      </div>

      {/* Men's Size Chart */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Men's Clothing
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Size
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Chest (in)
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Waist (in)
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Hips (in)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border-b border-gray-100">S</td>
                <td className="p-4 border-b border-gray-100">34 - 36</td>
                <td className="p-4 border-b border-gray-100">28 - 30</td>
                <td className="p-4 border-b border-gray-100">34 - 36</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">M</td>
                <td className="p-4 border-b border-gray-100">38 - 40</td>
                <td className="p-4 border-b border-gray-100">32 - 34</td>
                <td className="p-4 border-b border-gray-100">38 - 40</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">L</td>
                <td className="p-4 border-b border-gray-100">42 - 44</td>
                <td className="p-4 border-b border-gray-100">36 - 38</td>
                <td className="p-4 border-b border-gray-100">42 - 44</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">XL</td>
                <td className="p-4 border-b border-gray-100">46 - 48</td>
                <td className="p-4 border-b border-gray-100">40 - 42</td>
                <td className="p-4 border-b border-gray-100">46 - 48</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">XXL</td>
                <td className="p-4 border-b border-gray-100">50 - 52</td>
                <td className="p-4 border-b border-gray-100">44 - 46</td>
                <td className="p-4 border-b border-gray-100">50 - 52</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Women's Size Chart */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Women's Clothing
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Size
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Bust (in)
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Waist (in)
                </th>
                <th className="p-4 border-b border-gray-200 font-semibold">
                  Hips (in)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border-b border-gray-100">XS</td>
                <td className="p-4 border-b border-gray-100">31 - 32</td>
                <td className="p-4 border-b border-gray-100">24 - 25</td>
                <td className="p-4 border-b border-gray-100">33 - 34</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">S</td>
                <td className="p-4 border-b border-gray-100">33 - 34</td>
                <td className="p-4 border-b border-gray-100">26 - 27</td>
                <td className="p-4 border-b border-gray-100">35 - 36</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">M</td>
                <td className="p-4 border-b border-gray-100">35 - 36</td>
                <td className="p-4 border-b border-gray-100">28 - 29</td>
                <td className="p-4 border-b border-gray-100">37 - 38</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">L</td>
                <td className="p-4 border-b border-gray-100">37 - 39</td>
                <td className="p-4 border-b border-gray-100">30 - 32</td>
                <td className="p-4 border-b border-gray-100">39 - 41</td>
              </tr>
              <tr>
                <td className="p-4 border-b border-gray-100">XL</td>
                <td className="p-4 border-b border-gray-100">40 - 42</td>
                <td className="p-4 border-b border-gray-100">33 - 35</td>
                <td className="p-4 border-b border-gray-100">42 - 44</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Measure */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          How to Measure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-2">Chest / Bust</h3>
            <p className="text-gray-600">
              Measure around the fullest part of your chest, keeping the tape
              horizontal.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Waist</h3>
            <p className="text-gray-600">
              Measure around the narrowest part (typically where your body bends
              side to side), keeping the tape horizontal.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Hips</h3>
            <p className="text-gray-600">
              Measure around the fullest part of your hips, keeping the tape
              horizontal.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-6">
          Still unsure? Contact our support team for assistance.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
