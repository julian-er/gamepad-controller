import {
    LandingArchitectureSection,
    LandingCallToAction,
    LandingExperiencesSection,
    LandingHero,
    LandingIntegrationSection,
    LandingPlaygroundSection,
    SiteFooter,
} from '../components/organisms/LandingSections';

export function Landing({ repository, suspended = false }: { repository: string; suspended?: boolean }) {
    return <>
        <main id="main-content" tabIndex={-1}>
            <LandingHero />
            <LandingPlaygroundSection suspended={suspended} />
            <LandingExperiencesSection />
            <LandingArchitectureSection />
            <LandingIntegrationSection />
            <LandingCallToAction repository={repository} />
        </main>
        <SiteFooter repository={repository} />
    </>;
}
