import {
    LandingArchitectureSection,
    LandingCallToAction,
    LandingExperiencesSection,
    LandingHero,
    LandingIntegrationSection,
    LandingPlaygroundSection,
    SiteFooter,
} from '../components/organisms/LandingSections';

export function Landing({ repository }: { repository: string }) {
    return <>
        <main id="main-content" tabIndex={-1}>
            <LandingHero />
            <LandingPlaygroundSection />
            <LandingExperiencesSection />
            <LandingArchitectureSection />
            <LandingIntegrationSection />
            <LandingCallToAction repository={repository} />
        </main>
        <SiteFooter repository={repository} />
    </>;
}
