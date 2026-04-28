"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useI18n } from "@/components/locatomed/i18n-provider";
import { cn } from "@/lib/utils";

const SECTION_IDS = ["hero", "features", "how-it-works", "why-us", "contact"];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const pathname = usePathname();
  const { t } = useI18n();

  const navLinks = [
    { label: t("landingNavbar.home", "Accueil"), href: "#hero" },
    { label: t("landingNavbar.features", "Fonctionnalites"), href: "#features" },
    { label: t("landingNavbar.howItWorks", "Comment ca marche"), href: "#how-it-works" },
    { label: t("landingNavbar.whyUs", "Pourquoi LocatMed"), href: "#why-us" },
    { label: t("landingNavbar.business", "Business"), href: "/business" },
    { label: t("landingNavbar.contact", "Contact"), href: "#contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((best, curr) =>
          curr.intersectionRatio > best.intersectionRatio ? curr : best
        );
        setActiveSection(top.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  const isActiveLink = (href: string) => {
    if (href.startsWith("/")) return pathname === href;
    if (href.startsWith("#")) return pathname === "/" && activeSection === href.slice(1);
    return false;
  };

  const desktopLinkClass = (active: boolean) =>
    cn(
      "text-sm transition-colors border-b-2",
      active ? "font-bold border-[#0d9488]" : "font-medium border-transparent",
      scrolled && active && "text-[#0d9488]",
      scrolled && !active && "text-[#0f2420] hover:text-[#0d9488]",
      !scrolled && active && "text-white",
      !scrolled && !active && "text-white/90 hover:text-white"
    );

  const mobileLinkClass = (active: boolean) =>
    cn(
      "text-base transition-colors border-b-2 pb-1",
      active
        ? "font-bold text-[#0d9488] border-[#0d9488]"
        : "font-medium text-gray-700 hover:text-[#14b8a6] border-transparent"
    );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b"
      style={{
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottomColor: scrolled ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)",
        borderBottomWidth: "1px",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-locatomed.png"
              alt="LocatMed"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-6 border"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderColor: "rgba(255, 255, 255, 0.18)",
              borderRadius: "9999px",
              padding: "6px 20px",
            }}
          >
            {navLinks.map((link) => {
              const active = isActiveLink(link.href);
              return link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className={desktopLinkClass(active)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={desktopLinkClass(active)}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/patient/login"
              className={cn(
                "inline-flex items-center justify-center transition-colors",
                scrolled
                  ? "bg-transparent text-[#0d9488] border-[#0d9488] hover:bg-[#f0fdfa]"
                  : "bg-transparent text-white border-white hover:bg-white/10"
              )}
              style={{
                fontWeight: 700,
                borderRadius: "9999px",
                padding: "10px 28px",
                border: "2px solid",
              }}
            >
              {t("landingNavbar.login", "Se connecter")}
            </Link>
            <Link
              href="/patient/signup"
              className="inline-flex items-center justify-center bg-white text-[#0d9488] hover:bg-[#f0fdfa] hover:text-[#0f766e] transition-colors"
              style={{
                fontWeight: 700,
                borderRadius: "9999px",
                padding: "10px 28px",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 12px rgba(255, 255, 255, 0.3)",
              }}
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
                  <img
                    src="/logo-locatomed.png"
                    alt="LocatMed"
                    className="h-10 w-auto object-contain"
                  />
                </Link>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => {
                    const active = isActiveLink(link.href);
                    return link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className={mobileLinkClass(active)}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className={mobileLinkClass(active)}
                      >
                        {link.label}
                      </a>
                    );
                  })}
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
