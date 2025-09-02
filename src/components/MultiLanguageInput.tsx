import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import WysiwygEditor from '@/components/WysiwygEditor';

interface MultiLanguageInputProps {
  label: string;
  type?: 'text' | 'textarea' | 'wysiwyg';
  values: {
    en: string;
    id: string;
  };
  onChange: (values: { en: string; id: string }) => void;
  required?: boolean;
  placeholder?: {
    en?: string;
    id?: string;
  };
}

type Language = 'en' | 'id';

const LANGUAGE_CONFIG = {
  en: {
    label: 'English',
    flag: '🇺🇸',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    focusRing: 'focus:ring-blue-500',
    tabColor: 'border-blue-500 text-blue-600 bg-blue-50'
  },
  id: {
    label: 'Indonesia',
    flag: '🇮🇩', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    focusRing: 'focus:ring-red-500',
    tabColor: 'border-red-500 text-red-600 bg-red-50'
  }
} as const;

export default function MultiLanguageInput({
  label,
  type = 'text',
  values,
  onChange,
  required = false,
  placeholder = {}
}: MultiLanguageInputProps) {
  const [activeTab, setActiveTab] = useState<Language>('en');

  const handleValueChange = (value: string) => {
    onChange({
      ...values,
      [activeTab]: value
    });
  };

  const getInputComponent = () => {
    const config = LANGUAGE_CONFIG[activeTab];
    const currentValue = values[activeTab];
    const currentPlaceholder = placeholder[activeTab] || `Enter ${label.toLowerCase()} in ${config.label}`;

    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={currentPlaceholder}
            className={`w-full min-h-[120px] px-3 py-2 border border-t-0 rounded-b-md rounded-tr-md focus:outline-none focus:ring-2 resize-none ${config.borderColor} ${config.bgColor} ${config.focusRing}`}
            required={required}
          />
        );
      case 'wysiwyg':
        return (
          <div className={`border border-t-0 rounded-b-md rounded-tr-md ${config.borderColor} ${config.bgColor} p-1`}>
            <WysiwygEditor
              value={currentValue}
              onChange={handleValueChange}
              placeholder={currentPlaceholder}
            />
          </div>
        );
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={currentPlaceholder}
            required={required}
            className={`border-t-0 rounded-b-md rounded-tr-md ${config.borderColor} ${config.bgColor} ${config.focusRing} focus:ring-2`}
          />
        );
    }
  };

  const getCompletionStatus = () => {
    const enFilled = values.en.trim().length > 0;
    const idFilled = values.id.trim().length > 0;
    
    return {
      en: enFilled,
      id: idFilled,
      both: enFilled && idFilled
    };
  };

  const status = getCompletionStatus();

  return (
    <div className="space-y-3">
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {/* Completion Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.en ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={status.en ? 'text-green-600' : 'text-gray-500'}>EN</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${status.id ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className={status.id ? 'text-green-600' : 'text-gray-500'}>ID</span>
          </div>
          {status.both && (
            <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-green-100 rounded-full">
              <span className="text-green-700 font-medium">✓ Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex">
        {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => {
          const config = LANGUAGE_CONFIG[lang];
          const isActive = activeTab === lang;
          const isFilled = status[lang];
          
          return (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTab(lang)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 border-l border-r border-t rounded-t-md transition-all duration-200 ${
                isActive 
                  ? `${config.tabColor} border-b-transparent font-medium` 
                  : 'border-gray-300 border-b-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100'
              } ${lang === 'en' ? 'rounded-tl-md border-l' : 'border-l-0 rounded-tr-md border-r'}`}
            >
              <span className="text-lg">{config.flag}</span>
              <span className="text-sm font-medium">{config.label}</span>
              {isFilled && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {getInputComponent()}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>
          Currently editing in <strong>{LANGUAGE_CONFIG[activeTab].label}</strong>. 
          {!status.both && (
            <span className="text-amber-600 ml-1">
              ⚠️ Please fill in both languages.
            </span>
          )}
          {status.both && (
            <span className="text-green-600 ml-1">
              ✅ Both languages completed!
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
