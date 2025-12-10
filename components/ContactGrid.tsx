import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, Phone, MapPin, Instagram } from 'lucide-react';

export const ContactGrid: React.FC = () => {
  return (
    <section id="contact" className="py-24 bg-zinc-950 relative z-10">
      <div className="container mx-auto px-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-['Syne'] font-bold mb-4">Get in Touch</h2>
          <p className="text-zinc-400 text-lg">We'd love to hear from you.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-zinc-600 transition-colors duration-500"
        >
          <div className="grid md:grid-cols-2">
            
            {/* Contact Info Side */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-zinc-800">
                <div className="space-y-10">
                    
                    {/* Emails */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/5 rounded-full"><Mail className="w-5 h-5 text-white" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Email Us</h3>
                        </div>
                        
                        <div className="space-y-6 pl-10">
                            <div>
                                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">General Inquiries</p>
                                <a href="mailto:hardik@elgrace.in" className="text-lg text-white hover:text-zinc-300 transition-colors border-b border-white/20 pb-1 inline-block">
                                    hardik@elgrace.in
                                </a>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Business & Productions</p>
                                <a href="mailto:business@elgrace.in" className="text-lg text-white hover:text-zinc-300 transition-colors border-b border-white/20 pb-1 inline-block">
                                    business@elgrace.in
                                </a>
                            </div>
                            <div>
                                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">New talent?</p>
                                <a href="mailto:talent@elgrace.in" className="text-lg text-white hover:text-zinc-300 transition-colors border-b border-white/20 pb-1 inline-block">
                                    talent@elgrace.in
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/5 rounded-full"><Phone className="w-5 h-5 text-white" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Call Us</h3>
                        </div>
                        <div className="pl-10">
                             <a href="tel:+918882395715" className="text-xl font-medium text-white hover:text-zinc-300 transition-colors">
                                +91 88823 95715
                             </a>
                             <p className="text-zinc-500 text-sm mt-1">Available on WhatsApp for urgent queries.</p>
                        </div>
                    </div>

                    {/* Socials */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/5 rounded-full"><Instagram className="w-5 h-5 text-white" /></div>
                        <h3 className="text-xl font-bold font-['Syne']">Follow Us</h3>
                        </div>
                        <div className="pl-10">
                            <a href="https://www.instagram.com/elgracetalents/" target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-white hover:text-zinc-300 transition-colors">
                            @elgracetalents
                            </a>
                        </div>
                    </div>

                </div>
            </div>

            {/* Hours & Location Side */}
            <div className="p-8 md:p-12 bg-zinc-900/80">
                <div className="space-y-10">
                    
                    {/* Hours */}
                    <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/5 rounded-full"><Clock className="w-5 h-5 text-white" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Office Hours</h3>
                        </div>
                        <div className="pl-10">
                             <p className="text-white text-lg">09:00 am – 05:00 pm</p>
                             <p className="text-zinc-500">Open Today</p>
                        </div>
                    </div>

                    {/* Simple Map / Location Placeholder */}
                    <div>
                         <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/5 rounded-full"><MapPin className="w-5 h-5 text-white" /></div>
                            <h3 className="text-xl font-bold font-['Syne']">Location</h3>
                        </div>
                        <div className="pl-10">
                             <p className="text-white text-lg font-medium">
                                 Pan India
                             </p>
                             <p className="text-zinc-500 text-sm mt-1">
                                 Home office - New Delhi
                             </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-8 mt-8 border-t border-zinc-800">
                        <a 
                            href="mailto:business@elgrace.in"
                            className="flex items-center justify-center w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors rounded-sm"
                        >
                            Start a Project
                        </a>
                    </div>

                </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};