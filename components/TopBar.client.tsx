'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher.client';

interface TopBarProps {
  userName?: string | null;
}

export default function TopBar({ userName }: TopBarProps) {
  const t = useTranslations('common');
  const iconOnlyTooltipClassName = 'sm:hidden';

  return (
    <TooltipProvider delayDuration={250}>
      <div className="animate-fadeIn fixed top-6 right-6 z-50">
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/40 bg-white/80 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          {/* User Profile Badge */}
          {userName && (
            <div className="mr-1 hidden items-center gap-2 rounded-xl border border-gray-100/50 bg-gray-50/50 px-3 py-1.5 sm:flex">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-violet-400 to-fuchsia-400 text-[10px] font-bold text-white shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold tracking-tight text-gray-600">{userName}</span>
            </div>
          )}

          {/* Language Switcher */}
          <div className="rounded-xl transition-colors hover:bg-gray-100/80">
            <LanguageSwitcher />
          </div>

          {/* Separator (Subtle dot) */}
          <div className="mx-1 h-1 w-1 rounded-full bg-gray-200" />

          {/* Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                className="group h-auto rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100/80 hover:text-gray-900"
                aria-label={t('settings')}
              >
                <Link href="/dashboard/settings">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-4 w-4 text-gray-500 transition-colors group-hover:text-violet-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="hidden sm:inline">{t('settings')}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8} className={iconOnlyTooltipClassName}>
              {t('settings')}
            </TooltipContent>
          </Tooltip>

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="group h-auto rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700"
                aria-label={t('logout')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-4 w-4 transition-transform group-hover:scale-110"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8} className={iconOnlyTooltipClassName}>
              {t('logout')}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
