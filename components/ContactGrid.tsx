import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, Phone, MapPin, Instagram, Linkedin, Copy, ArrowUpRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { contactGridClasses, ThemeVariant } from '../theme/homeSections.ts';

type ContactGridProps = {
    variant?: ThemeVariant;
};

export const ContactGrid: React.FC<ContactGridProps> = ({ variant = 'light' }) => {
  const { showToast } = useToast();
    const c = contactGridClasses[variant];

  const copyEmail = async () => {
    try {
            await navigator.clipboard.writeText('creatives@elgrace.in');
      showToast('📧 Email copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy email');
    }
  };

    const copyHiringEmail = async () => {
        try {
            await navigator.clipboard.writeText('hardik@elgrace.in');
            showToast('📧 Hiring email copied to clipboard!');
        } catch (err) {
            showToast('Failed to copy hiring email');
        }
    };

    return (
        <>
        <section id="contact" className={`py-24 relative z-10 ${c.section}`}>
            <div className="container mx-auto px-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-['Syne'] font-bold mb-4">Get in Touch</h2>
                    <p className={`text-lg ${c.headingSub}`}>We'd love to hear from you.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
                    className={`max-w-5xl mx-auto rounded-2xl overflow-hidden backdrop-blur-sm border transition-colors duration-500 ${c.card}`}
        >
          <div className="grid md:grid-cols-2">
            
            {/* Contact Info Side */}
            <div className={`p-8 md:p-12 border-b md:border-b-0 md:border-r ${c.divider}`}>
                <div className="space-y-10">
                    
                    {/* Emails */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${c.iconChip}`}><Mail className="w-5 h-5" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Email Us</h3>
                        </div>
                        
                        <div className="space-y-6 pl-10">
                            <div>
                                <p className={`text-sm uppercase tracking-wider mb-1 ${c.label}`}>General Queries</p>
                                <a
                                    href="mailto:creatives@elgrace.in"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open('mailto:creatives@elgrace.in', '_self');
                                    }}
                                    className={`text-lg transition-colors border-b pb-1 inline-block cursor-pointer ${c.link}`}
                                >
                                    creatives@elgrace.in
                                </a>
                            </div>
                            <div>
                                <p className={`text-sm uppercase tracking-wider mb-1 ${c.label}`}>Business Enquiries</p>
                                <a
                                    href="mailto:creatives@elgrace.in"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open('mailto:creatives@elgrace.in', '_self');
                                    }}
                                    className={`text-lg transition-colors border-b pb-1 inline-block cursor-pointer ${c.link}`}
                                >
                                    business@elgrace.in
                                </a>
                            </div>
                            <div>
                                <p className={`text-sm uppercase tracking-wider mb-1 ${c.label}`}>New talent</p>
                                <a
                                    href="mailto:talent@elgrace.in"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.open('mailto:talent@elgrace.in', '_self');
                                    }}
                                    className={`text-lg transition-colors border-b pb-1 inline-block cursor-pointer ${c.link}`}
                                >
                                    talent@elgrace.in
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${c.iconChip}`}><Phone className="w-5 h-5" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Call Us</h3>
                        </div>
                        <div className="pl-10">
                                      <a href="tel:+919211365589" className="text-xl font-medium hover:opacity-90 transition-opacity">
                                          +91 92113 65589
                             </a>
                             <p className={`text-sm mt-1 ${c.phoneHint}`}>Available on WhatsApp for urgent queries.</p>
                        </div>
                    </div>

                                        {/* Socials */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                            <div className={`p-2 rounded-full flex items-center justify-center ${c.iconChip}`}>
                                                                <ArrowUpRight className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-xl font-bold font-['Syne']">Follow Us</h3>
                                            </div>
                                            <div className="pl-10 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full flex items-center justify-center ${c.iconChip}`}>
                                                        <Instagram className="w-4 h-4" />
                                                    </div>
                                                    <a
                                                        href="https://www.instagram.com/elgracetalents/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xl font-medium hover:opacity-90 transition-opacity"
                                                    >
                                                        Instagram – @elgracetalents
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full flex items-center justify-center ${c.iconChip}`}>
                                                        <Linkedin className="w-4 h-4" />
                                                    </div>
                                                    <a
                                                        href="https://www.linkedin.com/company/elgracetalents"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xl font-medium hover:opacity-90 transition-opacity"
                                                    >
                                                        LinkedIn – Elgrace Talents
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA - Copy Email (moved to left side) */}
                                        <div className={`pt-4 border-t mt-4 ${c.divider}`}>
                                            <button
                                                onClick={copyEmail}
                                                className={`flex items-center justify-center gap-2 w-full py-4 font-bold uppercase tracking-widest transition-colors rounded-2xl bg-gradient-to-br border backdrop-blur-md cursor-pointer ${c.cta}`}
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy Email Address
                                            </button>
                                        </div>

                </div>
            </div>

            {/* Hours & Location Side */}
            <div className={`p-8 md:p-12 ${c.panelRight}`}>
                <div className="space-y-10">
                    
                    {/* Hours */}
                    <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-full ${c.iconChip}`}><Clock className="w-5 h-5" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Office Hours</h3>
                        </div>
                        <div className="pl-10">
                             <p className="text-lg">09:00 am – 05:00 pm</p>
                             <p className={c.label}>Open Today</p>
                        </div>
                                        </div>

                                        {/* 3D India Map with Animated Pins (grid-based) */}
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-full ${c.iconChip}`}><MapPin className="w-5 h-5" /></div>
                                                <h3 className="text-xl font-bold font-['Syne']">Presence</h3>
                                            </div>
                                            <div className="pl-10 space-y-4">
                                                            <p className={`text-lg font-medium ${c.mapTitle}`}>
                                                    Our Pan India Network
                                                </p>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 16, scale: 0.94 }}
                                                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                                    whileHover={{ y: -6, scale: 1.02 }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    className={`relative w-full max-w-sm aspect-[3/4] rounded-[26px] border bg-gradient-to-br overflow-hidden ${c.mapCard}`}
                                                >
                                                    {/* Inner plate */}
                                                    <div className={`absolute inset-[10px] rounded-[22px] border bg-gradient-to-b ${c.mapInner}`} />

                                                    {/* Grid lines */}
                                                    <div className="absolute inset-[26px] opacity-35">
                                                        <div className={`absolute inset-x-0 top-1/4 border-t ${c.mapGrid}`} />
                                                        <div className={`absolute inset-x-0 top-1/2 border-t ${c.mapGrid}`} />
                                                        <div className={`absolute inset-x-0 top-3/4 border-t ${c.mapGrid}`} />
                                                        <div className={`absolute inset-y-0 left-1/3 border-l ${c.mapGrid}`} />
                                                        <div className={`absolute inset-y-0 left-2/3 border-l ${c.mapGrid}`} />
                                                    </div>

                                                    {/* India silhouette from external SVG */}
                                                    <img
                                                        src="https://upload.wikimedia.org/wikipedia/commons/b/b4/India_outline.svg"
                                                        alt="India outline"
                                                        className={`absolute inset-[28px] w-[calc(100%-56px)] h-[calc(100%-56px)] object-contain ${c.indiaOutlineImg}`}
                                                    />

                                                    {/* Soft center glow */}
                                                    <div className={`absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl ${c.mapGlow}`} />

                                                                                                        {/* City pins laid out as an India silhouette (tuned to outline) */}
                                                                                                        {[
                                                                                                            // North cluster
                                                                                                            { name: 'CHANDIGARH', top: '28%', left: '3%' },
                                                                                                            { name: 'DEHRADUN', top: '30%', left: '38%' },
                                                                                                            { name: 'DELHI', top: '35%', left: '35%' },
                                                                                                            // West / Gujarat / Maharashtra
                                                                                                            { name: 'AHMEDABAD', top: '45%', left: '19%' },
                                                                                                            { name: 'SURAT', top: '51%', left: '22%' },
                                                                                                            { name: 'MUMBAI', top: '56%', left: '22%' },
                                                                                                            // Central / South-west
                                                                                                            { name: 'GOA', top: '64%', left: '9%' },
                                                                                                            { name: 'HYDERABAD', top: '60.3%', left: '38%' },
                                                                                                            // South
                                                                                                            { name: 'BANGALORE', top: '70%', left: '36%' },
                                                                                                        ].map((city) => {
                                                                                                            const isLeftLabel = city.name === 'CHANDIGARH' || city.name === 'GOA';
                                                                                                            return (
                                                                                                                <div
                                                                                                                    key={city.name}
                                                                                                                    className="absolute"
                                                                                                                    style={{ top: city.top, left: city.left }}
                                                                                                                >
                                                                                                                    <div className="relative flex items-center gap-2">
                                                                                                                        {isLeftLabel && (
																				<span className={`text-[10px] font-semibold tracking-[0.22em] px-3 py-1 rounded-full border ${c.mapCityPill}`}>
                                                                                                                                {city.name}
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                        <div className="relative">
                                                                                                                            <span className="absolute inline-flex h-4 w-4 rounded-full bg-white/25 animate-ping" />
                                                                                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
                                                                                                                        </div>
                                                                                                                        {!isLeftLabel && (
																				<span className={`text-[10px] font-semibold tracking-[0.22em] px-3 py-1 rounded-full border ${c.mapCityPill}`}>
                                                                                                                                {city.name}
                                                                                                                            </span>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            );
                                                                                                        })}

                                                    {/* Label bottom-left */}
															<div className={`absolute left-6 bottom-5 text-[10px] tracking-[0.28em] uppercase ${c.mapFooterLabel}`}>
                                                        ELGRACE INDIA MAP
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </div>
                </div>
            </div>

          </div>
                </motion.div>
            </div>
        </section>

        {/* Hiring section directly below contact grid */}
        <section className={`py-16 border-t relative z-10 ${c.hiringSection}`}>
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h3 className="text-3xl md:text-4xl font-['Syne'] font-bold mb-4">
                        We are always hiring
                    </h3>
                    <p className={`mb-6 text-sm md:text-base ${c.hiringBody}`}>
                        Are you a passionate individual who wants to work with Elgrace? Share your portfolio or CV with our team.
                    </p>
                    <button
                        onClick={copyHiringEmail}
                        className={`inline-flex items-center gap-2 px-8 py-3 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-widest bg-gradient-to-br border backdrop-blur-md cursor-pointer ${c.cta}`}
                    >
                        <Copy className="w-4 h-4" />
                        Apply here
                    </button>
                </motion.div>
            </div>
        </section>
        </>
  );
};