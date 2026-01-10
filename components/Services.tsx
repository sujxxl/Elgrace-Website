import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight, CheckCircle2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { homeSectionClasses, homeServiceGradients } from '../theme/homeSections.ts';

interface Service {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  image: string;
  color: string;
}

const services: Service[] = [
  {
    id: 1,
    title: "Elgrace Talents",
    subtitle: "Talent Sourcing & Management",
    description:
      "Elgrace Talents is the core talent division of the group. We specialize in sourcing, vetting, and managing top models, actors, celebrities and creative professionals for campaigns, films, OTT and brand content. We handle every detail—from casting and negotiations to on-set supervision and compliance—ensuring both brands and talent have an empowering, frictionless experience.",
    features: [
      "Verified Models, Actors & Celebrity Roster",
      "Digital Casting & Shortlisting Platform",
      "Usage Rights, Contracts & Compliance Mgmt",
      "End-to-End Supervision from Brief to Shoot",
    ],
    icon: <Users className="w-6 h-6" />,
    image: "elgrace-logo-inverted.png",
    color: homeServiceGradients.default
  },
  {
    id: 2,
    title: "EventIcon",
    subtitle: "Event Manpower & Experiential Teams",
    description:
      "Eventicon is the dedicated manpower division of Elgrace — supplying trained on-ground teams for launches, exhibitions, mall activations, concerts and corporate events. From promoters, ushers and registration desks to backstage support, we ensure your event is fully staffed with reliable, brand-ready professionals.",
    features: [
      "Promoters, Hosts, Ushers & Brand Reps",
      "Pan-India Event Manpower & Coordination",
      "Backstage, Tech & Hospitality Support",
      "On-Ground Supervision by Elgrace Team",
    ],
    icon: <Users className="w-6 h-6" />,
    image: "https://picsum.photos/1000/&random=41",
    color: homeServiceGradients.default
  }
];

const Card: React.FC<{ 
  service: Service; 
  index: number; 
  progress: any; 
  range: number[]; 
  targetScale: number; 
  total: number;
  onExplore?: () => void;
}> = ({ service, index, progress, range, targetScale, total, onExplore }) => {
  const container = useRef<HTMLDivElement>(null);
  
  // Scroll Animation Logic
  const scale = useTransform(progress, range, [1, targetScale]);
  
  // Blur & Opacity Logic for "Past" cards
  // If it's not the last card, we blur it and fade it out as scroll progresses
  const isLast = index === total - 1;
  
  // Delay the start of the blur effect so the card stays sharp longer
  // We calculate a midpoint in the range to start the transition
  const start = range[0];
  const end = range[1];
  const delayPoint = start + (end - start) * 0.4; // 40% delay

  const blurValue = useTransform(progress, [start, delayPoint, end], [0, 0, isLast ? 0 : 10]);
  const filter = useTransform(blurValue, (v) => `blur(${v}px)`);
  const opacity = useTransform(progress, [start, delayPoint, end], [1, 1, isLast ? 1 : 0.4]);

  // 3D Tilt Logic (Mouse Interaction)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!container.current) return;
    const rect = container.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="h-screen flex items-center justify-center sticky top-0">
      <motion.div 
        ref={container}
        style={{ 
          scale,
          filter,
          opacity, 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d",
          top: `calc(-5% + ${index * 25}px)` 
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full max-w-6xl h-[70vh] md:h-[600px] flex flex-col md:flex-row rounded-3xl overflow-hidden border origin-top shadow-2xl ${homeSectionClasses.services.card}`}
      >
        {/* Visual Content - Left/Top */}
        <div className="w-full md:w-5/12 relative overflow-hidden group">
             <div className={`absolute inset-0 animate-pulse ${homeSectionClasses.services.imagePlaceholder}`} />
             <img 
               src={service.image} 
               alt={service.title} 
               className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-in-out" 
             />
             <div className={`absolute inset-0 bg-gradient-to-br ${service.color} mix-blend-overlay opacity-60`} />
             <div className={`absolute top-6 left-6 p-4 backdrop-blur-md rounded-full border ${homeSectionClasses.services.iconBadge}`}>
                {service.icon}
             </div>
        </div>

        {/* Text Content - Right/Bottom */}
        <div className={`w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-between backdrop-blur-xl relative ${homeSectionClasses.services.rightPanel}`}>
             {/* Gradient Glow */}
           <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${service.color} rounded-full blur-[100px] pointer-events-none ${homeSectionClasses.services.glow}`} />
             
             <div className="relative z-10">
            <h4 className={`uppercase tracking-widest text-sm font-bold mb-2 ${homeSectionClasses.services.subtitle}`}>{service.subtitle}</h4>
            <h3 className={`text-4xl md:text-5xl font-['Syne'] font-bold mb-6 ${homeSectionClasses.services.headerTitle}`}>{service.title}</h3>
            <p className={`leading-relaxed text-lg mb-8 ${homeSectionClasses.services.body}`}>
                    {service.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {service.features.map((feature, i) => (
                <div key={i} className={`flex items-center gap-3 ${homeSectionClasses.services.feature}`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${homeSectionClasses.services.featureIcon}`} />
                            <span className="text-sm">{feature}</span>
                        </div>
                    ))}
                </div>
             </div>

           <div className={`relative z-10 pt-6 border-t ${homeSectionClasses.services.footerBorder}`}>
               <button
                 onClick={onExplore}
             className={`group flex items-center gap-2 font-bold uppercase tracking-widest text-sm transition-colors border-b border-transparent pb-1 ${homeSectionClasses.services.cta}`}
               >
                    Explore Services 
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Services: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  });

  return (
    <section
      id="services"
      ref={container}
      className={`relative ${homeSectionClasses.services.section}`}
      style={{ height: `${services.length * 100 + 50}vh` }}
    >
        
        {/* Header - Changed from sticky to static relative to avoid overlap */}
        <div className="pt-16 pb-12 text-center relative z-10">
            <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className={`uppercase tracking-widest text-sm mb-2 ${homeSectionClasses.services.headerKicker}`}
            >
                What We Do
            </motion.h2>
            <motion.h3 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className={`text-3xl font-['Syne'] font-bold ${homeSectionClasses.services.headerTitle}`}
            >
                Our Expertise
            </motion.h3>
        </div>

        <div className="container mx-auto px-4 md:px-6">
            {services.map((service, index) => {
                const targetScale = 1 - ((services.length - index) * 0.05);
                return (
                    <Card 
                        key={service.id} 
                        index={index} 
                        service={service} 
                        progress={scrollYProgress}
                        range={[index * 0.25, 1]}
                        targetScale={targetScale}
                        total={services.length}
                        onExplore={
                          service.id === 1
                            ? () => navigate('/services/elgrace-talents')
                            : service.id === 2
                            ? () => navigate('/services/eventicon')
                            : undefined
                        }
                    />
                );
            })}
        </div>
    </section>
  );
};