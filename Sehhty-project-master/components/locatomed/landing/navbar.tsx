"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  const navLinks = [
    { label: t("landingNavbar.home", "Accueil"), href: "#hero" },
    { label: t("landingNavbar.features", "Fonctionnalites"), href: "#features" },
    { label: t("landingNavbar.howItWorks", "Comment ca marche"), href: "#how-it-works" },
    { label: t("landingNavbar.whyUs", "Pourquoi LOCATOMED"), href: "#why-us" },
    { label: t("landingNavbar.business", "Business"), href: "/business" },
    { label: t("landingNavbar.contact", "Contact"), href: "#contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              LOCATOMED
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/patient/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              {t("landingNavbar.login", "Se connecter")}
            </Link>
            <Link
              href="/patient/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-gradient-to-r from-teal-500 to-teal-500 hover:from-teal-600 hover:to-teal-600 text-white shadow-md shadow-teal-200 border-0"
              )}
            >
              {t("landingNavbar.start", "Commencer")}
            </Link>
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-8">
                <Link href="/" className="flex items-center gap-2">
                  {/* TODO: replace with <img src="/logo-locatomed.png" /> */}
            <span style={{ fontFamily: "serif", fontWeight: "bold", color: "#14b8a6" }}>LOCATOMED</span>
                  <span className="font-bold text-xl text-gray-900">LOCATOMED</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) =>
                    link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-base font-medium text-gray-700 hover:text-teal-600 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-base font-medium text-gray-700 hover:text-teal-600 transition-colors"
                      >
                        {link.label}
                      </a>
                    )
                  )}
                </nav>
                <div className="flex flex-col gap-3 pt-2">
                  <Link
                    href="/patient/login"
                    className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                  >
                    {t("landingNavbar.login", "Se connecter")}
                  </Link>
                  <Link
                    href="/patient/signup"
                    className={cn(
                      buttonVariants(),
                      "w-full justify-center bg-gradient-to-r from-teal-500 to-teal-500 text-white border-0"
                    )}
                  >
                    {t("landingNavbar.start", "Commencer")}
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
