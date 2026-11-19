import {AboutSection} from '../components/AboutSection.tsx';
import {CinematicLoader} from '../components/CinematicLoader.tsx';
import {ContactSection, FloatingWhatsApp, Footer} from '../components/ContactAndFooter.tsx';
import {CustomCursor} from '../components/CustomCursor.tsx';
import {HeroSection} from '../components/HeroSection.tsx';
import {Navbar} from '../components/Navbar.tsx';
import {ProjectsSection} from '../components/ProjectsSection.tsx';
import {ServicesSection} from '../components/ServicesSection.tsx';
import type {PortfolioData} from '../types/portfolio.ts';

interface PortfolioPageProps {
  data: PortfolioData;
  onNavigateSettings: () => void;
}

export function PortfolioPage({data, onNavigateSettings}: PortfolioPageProps) {
  const {profile, social, content, general, services, skills, projects} = data;

  return (
    <div className="relative min-h-screen bg-[#08090D] text-[#F5F5F7] overflow-x-clip">
      <CinematicLoader name={profile.name} enabled={content.showLoadingScreen} />
      <CustomCursor enabled={general.enableCustomCursor} />

      <Navbar
        brandName={profile.name}
        navLabels={content.navLabels}
        ctaLabel={profile.secondaryCtaLabel || "Let's Talk"}
        ctaHref={profile.secondaryCtaHref || '#contact'}
      />

      <main>
        <HeroSection profile={profile} enable3D={general.enable3DBackground} />

        <AboutSection
          profile={profile}
          skills={skills}
          skillsTitle={content.skillsTitle}
        />

        <ServicesSection
          title={content.servicesTitle}
          subtitle={content.servicesSubtitle}
          services={services}
        />

        <ProjectsSection
          title={content.projectsTitle}
          subtitle={content.projectsSubtitle}
          projects={projects}
        />

        <ContactSection content={content} social={social} />
      </main>

      <Footer
        profile={profile}
        content={content}
        social={social}
        onNavigateSettings={onNavigateSettings}
      />

      <FloatingWhatsApp
        whatsappLink={social.whatsappLink}
        enabled={general.enableFloatingWhatsApp}
      />
    </div>
  );
}
