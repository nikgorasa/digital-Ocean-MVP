"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

interface FooterLink {
  id: string;
  section: string;
  label: string;
  href: string | null;
}

export default function Footer() {
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [siteConfig, setSiteConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/footer-links").then((r) => r.json()).catch(() => []),
      fetch("/api/site-config").then((r) => r.json()).catch(() => ({})),
    ]).then(([links, config]) => {
      if (Array.isArray(links)) setFooterLinks(links);
      if (config && typeof config === "object" && !config.error) setSiteConfig(config);
    }).catch(() => {});
  }, []);

  return (
    <footer className="bg-brand-ivory border-t border-brand-champagne/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <StaggerItem className="md:col-span-1">
            <div className="mb-4">
              <Image src="/logo.svg" alt="GoRASA" width={120} height={36} className="h-9 w-auto" />
            </div>
            <p className="text-brand-sand text-sm leading-relaxed mb-4">
              Premium travel experiences crafted for the discerning traveler.
              Flights, hotels, and curated holiday packages.
            </p>
            <p className="text-brand-antique-gold font-serif italic text-sm">
              &ldquo;{siteConfig.footer_motto || "Experience The Finest"}&rdquo;
            </p>
          </StaggerItem>

          {/* Quick Links */}
          {(() => {
            const exploreLinks = footerLinks.filter(
              (l) => l.section === "explore",
            );
            if (exploreLinks.length === 0) return null;
            return (
              <StaggerItem>
                <h4 className="font-display font-bold text-brand-charcoal mb-4 text-sm uppercase tracking-wider">
                  Explore
                </h4>
                <ul className="space-y-2.5">
                  {exploreLinks.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href || "#"}
                        className="text-brand-sand hover:text-brand-antique-gold text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            );
          })()}

          {/* Company */}
          {(() => {
            const companyLinks = footerLinks.filter(
              (l) => l.section === "company",
            );
            if (companyLinks.length === 0) return null;
            return (
              <StaggerItem>
                <h4 className="font-display font-bold text-brand-charcoal mb-4 text-sm uppercase tracking-wider">
                  Company
                </h4>
                <ul className="space-y-2.5">
                  {companyLinks.map((link) => (
                    <li key={link.id}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          className="text-brand-sand hover:text-brand-antique-gold text-sm transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span className="text-brand-sand hover:text-brand-antique-gold text-sm transition-colors cursor-pointer">
                          {link.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            );
          })()}

          {/* Contact */}
          <StaggerItem>
                <h4 className="font-display font-bold text-brand-charcoal mb-4 text-sm uppercase tracking-wider">
                  Contact
                </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone size={16} className="text-brand-antique-gold mt-0.5 shrink-0" />
                <span className="text-brand-sand text-sm">
                  {siteConfig.contact_phone || "+91 95285 00383"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={16} className="text-brand-antique-gold mt-0.5 shrink-0" />
                <span className="text-brand-sand text-sm">
                  {siteConfig.contact_email || "rasatravelindia@gmail.com"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-brand-antique-gold mt-0.5 shrink-0" />
                <span className="text-brand-sand text-sm">
                  {siteConfig.contact_company ||
                    "RASA Travel Services India Pvt Ltd"}
                </span>
              </li>
            </ul>
          </StaggerItem>
        </StaggerContainer>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-brand-champagne/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-brand-sand">
            &copy; {new Date().getFullYear()} RASA Travel Services India Private
            Limited. All rights reserved.
          </p>
          <p className="text-caption text-brand-sand/70 font-serif italic">
            Crafted with care for travelers who demand the finest
          </p>
        </div>
      </div>
    </footer>
  );
}
