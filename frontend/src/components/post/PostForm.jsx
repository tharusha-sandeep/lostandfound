import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, SearchX } from 'lucide-react';
import postSchema from '../../utils/postSchema';
import { CATEGORIES, ZONES } from '../../utils/constants';
import ImageUploader from './ImageUploader';

export default function PostForm({ onSubmit, defaultValues, isSubmitting, mode = 'create' }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      type: defaultValues?.type || '',
      title: defaultValues?.title || '',
      category: defaultValues?.category || '',
      zone: defaultValues?.zone || '',
      description: defaultValues?.description || '',
      incidentDate: defaultValues?.incidentDate ? new Date(defaultValues.incidentDate).toISOString().split('T')[0] : '',
    }
  });

  const [imageUrls, setImageUrls] = useState(defaultValues?.imageUrls || []);
  
  const watchedType = watch('type');
  const watchedTitle = watch('title');
  const watchedDesc = watch('description');

  if (mode === 'edit' && defaultValues?.status === 'resolved') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-yellow-800 font-medium">
          This post has been resolved and cannot be edited.
        </p>
      </div>
    );
  }

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, imageUrls });
  };

  const inputClass = "w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <form data-testid="post-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" noValidate>
      
      {/* 1. Post Type Radio Cards */}
      <div>
        <label className={labelClass}>Type of Report</label>
        <div className="grid grid-cols-2 gap-4">
          <label 
            className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              watchedType === 'lost' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 bg-white'
            }`}
          >
             <input data-testid="type-lost" type="radio" value="lost" {...register('type')} className="sr-only" />
             <SearchX className={`w-8 h-8 mb-2 ${watchedType === 'lost' ? 'text-red-600' : 'text-gray-400'}`} />
             <span className="font-medium">I Lost Something</span>
          </label>
          
          <label 
             className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
               watchedType === 'found' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200 bg-white'
             }`}
          >
             <input data-testid="type-found" type="radio" value="found" {...register('type')} className="sr-only" />
             <Search className={`w-8 h-8 mb-2 ${watchedType === 'found' ? 'text-blue-600' : 'text-gray-400'}`} />
             <span className="font-medium">I Found Something</span>
          </label>
        </div>
        {errors.type && <p className={errorClass}>{errors.type.message}</p>}
      </div>

      {/* 2. Title */}
      <div>
        <label className={labelClass} htmlFor="title">Item Title</label>
        <input 
          data-testid="title-input"
          id="title"
          autoComplete="off"
          {...register('title')} 
          placeholder="e.g. Black Sony earphones" 
          className={inputClass}
        />
        <div className="flex justify-between items-start mt-1">
          <p className={errorClass}>{errors.title?.message}</p>
          <span className="text-xs text-gray-400 ml-auto">{watchedTitle?.length || 0}/120</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 3. Category */}
        <div>
          <label className={labelClass} htmlFor="category">Category</label>
          <select data-testid="category-select" id="category" {...register('category')} className={inputClass}>
            <option value="">Select a category...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className={errorClass}>{errors.category.message}</p>}
        </div>

        {/* 4. Zone */}
        <div>
          <label className={labelClass} htmlFor="zone">Campus Zone</label>
          <select data-testid="zone-select" id="zone" {...register('zone')} className={inputClass}>
            <option value="">Select a zone...</option>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          {errors.zone && <p className={errorClass}>{errors.zone.message}</p>}
        </div>
      </div>

      {/* 5. Incident Date */}
      <div>
        <label className={labelClass} htmlFor="incidentDate">Date Lost/Found</label>
        <input 
          data-testid="date-input"
          type="date" 
          id="incidentDate"
          {...register('incidentDate')}
          max={new Date().toISOString().split('T')[0]}
          className={inputClass}
        />
        {errors.incidentDate && <p className={errorClass}>{errors.incidentDate.message}</p>}
      </div>

      {/* 6. Description */}
      <div>
        <label className={labelClass} htmlFor="description">Detailed Description</label>
        <textarea 
          data-testid="description-input"
          id="description"
          rows={5} 
          {...register('description')} 
          placeholder="Provide any identifying marks, serial numbers, or specific locations..."
          className={inputClass}
        />
        <div className="flex justify-between items-start mt-1">
          <p className={errorClass}>{errors.description?.message}</p>
          <span className="text-xs text-gray-400 ml-auto">{watchedDesc?.length || 0}/1000</span>
        </div>
      </div>

      {/* 7. Images */}
      <div>
        <label className={labelClass}>Images (Optional)</label>
        <ImageUploader 
          existingUrls={imageUrls}
          onChange={setImageUrls} 
        />
      </div>

      {/* 8. Submit button */}
      <div>
        <button
          data-testid="submit-button"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {isSubmitting ? 'Submitting...' : mode === 'create' ? 'Submit Report' : 'Save Changes'}
        </button>
      </div>

    </form>
  );
}
