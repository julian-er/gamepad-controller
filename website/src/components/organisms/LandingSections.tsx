import { Playground } from '../../Playground';
import { integrationExamples } from '../../examples';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Brand } from '../molecules/Brand';
import { InstallCommand } from '../molecules/InstallCommand';
import { FrameworkCode } from './FrameworkCode';

export function LandingHero() {
    return <section className="hero section-shell">
        <div className="hero-eyebrow"><span className="status-dot on" /><span>THE WEB. NOW WITH CONTROLLER SUPPORT.</span></div>
        <h1>Bring{' '}<span>console-grade<br className="desktop-break" /> navigation</span>{' '}to the web.</h1>
        <p className="hero-lede">Great interfaces deserve more than a mouse.<br />Turn any web experience into a world you can navigate with a gamepad.</p>
        <div className="hero-actions">
            <a className="button primary" href="#/docs/installation">Start building <Icon name="arrow" size={18} /></a>
            <a className="button secondary" href="#/docs/playground"><Icon name="pad" size={18} />Try the playground</a>
        </div>
        <InstallCommand />
        <p className="snippet-note">Registry install is available after the first publication.{' '}<a href="#/docs/building">Build and install locally →</a></p>
        <div className="hero-stage">
            <img src="./images/controllers.png" alt="Xbox and PlayStation controllers on a dark reflective stage with mint lighting" fetchPriority="high" width="1376" height="768" />
            <span className="stage-label mono"><span className="status-dot on" /> ONE ENGINE. EVERY CONTROLLER.</span>
            <div className="stage-caption"><span>Xbox</span><span>PlayStation</span><span>Generic gamepads</span><span>Native WebViews</span></div>
        </div>
        <div className="proof-strip">
            <div><strong>0</strong><span>Runtime dependencies</span></div>
            <div><strong>3</strong><span>Navigation modes</span></div>
            <div><strong>TypeScript</strong><span>Typed from the ground up</span></div>
            <div><strong>MIT</strong><span>Open source, always</span></div>
        </div>
    </section>;
}

export function LandingPlaygroundSection() {
    return <section className="section-shell landing-section" id="playground">
        <div className="section-heading">
            <div><span className="eyebrow">LESS READING. MORE PLAYING.</span><h2>Feel the difference.</h2></div>
            <p>A real controller. Real focus. Your interface.<br />Try the engine before writing your first line.</p>
        </div>
        <Playground />
        <div className="under-note">
            <Icon name="code" size={16} /> This demo runs on gamepad-ui-engine. So can yours.
            <a href="#/docs/examples">Explore eight mini apps →</a>
            <a href="#/docs/react">View the integration <Icon name="arrow" size={14} /></a>
        </div>
    </section>;
}

export function LandingExperiencesSection() {
    const useCases = [
        { icon: 'screen', title: 'Smart TVs & media hubs', text: 'Give every card a clear destination, with focus that feels natural across the room.' },
        { icon: 'layers', title: 'Desktop & native WebViews', text: 'Bridge host input to your web UI with a complete custom-event transport.' },
        { icon: 'pad', title: 'Cloud gaming & web apps', text: 'Let players move from a game to your menus without putting the controller down.' },
    ];
    return <section className="section-shell landing-section" id="experiences">
        <div className="section-heading centered">
            <span className="eyebrow">BEYOND THE DESKTOP</span>
            <h2>Your interface.<br /><span className="muted-heading">A whole new way to experience it.</span></h2>
            <p>From the browser tab to the biggest screen in the room.</p>
        </div>
        <div className="living-room">
            <img src="./images/living-room.png" alt="A television and handheld console showing a mint-accented media dashboard in a cozy living room" loading="lazy" width="1376" height="768" />
            <div><Badge>THE 10-FOOT EXPERIENCE</Badge><h3>Designed for the couch.<br />Built for the web.</h3><a href="#/docs/navigation">Explore spatial navigation <Icon name="arrow" size={16} /></a></div>
        </div>
        <div className="use-case-grid">{useCases.map((item) => <article key={item.title}><Icon name={item.icon} size={26} /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>;
}

export function LandingArchitectureSection() {
    return <section className="section-shell landing-section" id="architecture">
        <div className="section-heading">
            <div><span className="eyebrow">SMALL SURFACE. SERIOUS CONTROL.</span><h2>Everything you need.<br /><span className="muted-heading">Nothing in your way.</span></h2></div>
            <a className="text-link" href="#/docs/api">Explore the API <Icon name="arrow" size={17} /></a>
        </div>
        <div className="feature-grid">
            <article className="feature-featured">
                <div><Icon name="grid" size={28} /><h3>Navigation that knows<br />where to go.</h3><p>Spatial, grid, and horizontal modes turn direction into intention. Tune deadzones, repeat timing, and wrapping for your interface.</p><a href="#/docs/navigation">Find your direction →</a></div>
                <img src="./images/thumbstick.png" alt="Detailed analog thumbstick with mint directional arrows" width="1024" height="1024" loading="lazy" />
            </article>
            <article><Icon name="bolt" size={26} /><h3>Your actions. Your rules.</h3><p>Listen to raw input, cancel an action before it runs, and observe the result through a typed event API.</p><a href="#/docs/events">Meet the event system →</a></article>
            <article><Icon name="layers" size={26} /><h3>Focus, kept in context.</h3><p>Move between menus and content. Keep modal interaction inside its scope, then restore the previous focus.</p><a href="#/docs/navigation">Explore focus scopes →</a></article>
        </div>
    </section>;
}

export function LandingIntegrationSection() {
    return <section className="section-shell landing-section integration-section">
        <div>
            <span className="eyebrow">FROM INSTALL TO INTERACTION</span>
            <h2>Fits right into<br />your stack.</h2>
            <p>Standard DOM elements. A simple service.<br />No wrappers, no prescribed components.<br />Just your UI, with a new way in.</p>
            <div className="integration-pills"><Badge>React</Badge><Badge>Vanilla JS / TS</Badge><Badge>Angular</Badge><Badge>WebViews</Badge></div>
            <a className="text-link" href="#/docs/react">Explore framework guides <Icon name="arrow" size={16} /></a>
        </div>
        <FrameworkCode examples={integrationExamples} />
    </section>;
}

export function LandingCallToAction({ repository }: { repository: string }) {
    return <section className="section-shell cta-section">
        <span className="eyebrow">PRESS START ON SOMETHING GREAT</span><h2>Ready to take control?</h2><p>Your next interface is just a few lines away.</p>
        <a className="button primary" href="#/docs/installation">Get started <Icon name="arrow" size={18} /></a>
        <a className="button secondary" href={repository}><Icon name="github" size={18} />Explore on GitHub</a>
    </section>;
}

export function SiteFooter({ repository }: { repository: string }) {
    return <footer className="site-footer section-shell">
        <div><Brand /><p>Console-grade navigation.<br />Web-native freedom.</p></div>
        <div><strong>Build</strong><a href="#/docs/installation">Get started</a><a href="#/docs/react">React guide</a><a href="#/docs/angular">Angular guide</a><a href="#/docs/vanilla">Vanilla JS / TS guide</a><a href="#/docs/agent-skills">AI skills</a><a href="#/docs/playground">Playground</a></div>
        <div><strong>Explore</strong><a href="#/docs/api">API reference</a><a href="#/docs/controllers">Controller mappings</a><a href="#/docs/host-bridge">Host integration</a></div>
        <div><strong>Open source</strong><a href={repository}>GitHub ↗</a><a href={repository + '/issues'}>Report an issue ↗</a><span>MIT licensed</span></div>
        <div className="footer-bottom"><span>gamepad-ui-engine · Built for the web, played your way.</span><span className="mono">v1.0.0</span></div>
    </footer>;
}
