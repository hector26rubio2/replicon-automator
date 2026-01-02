import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';

interface OnboardingStep {
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: '👋',
    titleKey: 'onboarding.welcome.title',
    descriptionKey: 'onboarding.welcome.description',
  },
  {
    icon: '📄',
    titleKey: 'onboarding.csv.title',
    descriptionKey: 'onboarding.csv.description',
  },
  {
    icon: '🔐',
    titleKey: 'onboarding.credentials.title',
    descriptionKey: 'onboarding.credentials.description',
  },
  {
    icon: '⚙️',
    titleKey: 'onboarding.mappings.title',
    descriptionKey: 'onboarding.mappings.description',
  },
  {
    icon: '🚀',
    titleKey: 'onboarding.automation.title',
    descriptionKey: 'onboarding.automation.description',
  },
  {
    icon: '📅',
    titleKey: 'onboarding.scheduler.title',
    descriptionKey: 'onboarding.scheduler.description',
  },
];

const STORAGE_KEY = 'replicon-onboarding-complete';

// En modo desarrollo, permite forzar mostrar el onboarding
const isDev = import.meta.env.DEV;

export function OnboardingModal() {
  const { t } = useTranslation();
  // En dev, mostrar por defecto al cargar la página
  const [isOpen, setIsOpen] = useState(isDev);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // En modo desarrollo, mostrar siempre al cargar (ya se hace con el useState)
    if (isDev) {
      return;
    }
    
    // Check if onboarding was completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center text-4xl shadow-lg">
              {step.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {t(step.titleKey)}
          </h2>

          {/* Description */}
          <p className="text-center text-gray-600 dark:text-slate-300 leading-relaxed">
            {t(step.descriptionKey)}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-primary-500 w-6'
                    : index < currentStep
                    ? 'bg-primary-300 dark:bg-primary-700'
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-8 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
          >
            {t('onboarding.skip')}
          </button>

          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                {t('onboarding.prev')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg"
            >
              {isLastStep ? t('onboarding.start') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
