import React from 'react'

export default function SearchResultCard({
  image,
  title,
  subtitle,
  rating = 4.2,
  distance = '7.3 km',
  reviewsCount = 128,
  sentimentPercent = 58,
  status = 'Searched',
  onAdd,
}) {
  const sentimentIsNegative = sentimentPercent >= 50
  const sentimentBarColor = sentimentIsNegative
    ? 'bg-gradient-to-r from-red-500 via-yellow-400 to-yellow-300'
    : 'bg-gradient-to-r from-yellow-400 via-lime-400 to-emerald-500'

  return (
    <div className="relative max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
      <div className="relative h-48 sm:h-56 w-full">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${status === 'Open' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {status}
        </span>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3 items-start">
        <div className="col-span-2">
          <h3 className="text-lg leading-5 font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-300 mt-1 truncate">{subtitle}</p>}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center text-yellow-500">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.286 3.965c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.378 2.455c-.784.57-1.84-.197-1.54-1.118l1.286-3.965a1 1 0 00-.364-1.118L2.627 9.392c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.286-3.965z" />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-900 dark:text-gray-100">{rating}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300">{distance}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">{reviewsCount} reviews</div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-300">Details</div>
          <div className="mt-2">
            <button
              onClick={onAdd}
              aria-label="Add"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Analysis</div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`${sentimentBarColor} h-3 rounded-full`}
            style={{ width: `${sentimentPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-600 dark:text-gray-300">Negative {sentimentPercent}%</div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{reviewsCount} reviews</div>
        </div>
      </div>

      <button
        onClick={onAdd}
        aria-label="Primary add"
        className="absolute -bottom-4 right-4 bg-indigo-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
