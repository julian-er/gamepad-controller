import { demos } from './registry';
export function DemoGallery() {
    return (
        <div className="demo-gallery">
            {['Websites', 'Small apps', 'Landing pages', 'Mini games'].map((category) => (
                <section key={category}>
                    <h2>{category}</h2>
                    <div className="demo-cards">
                        {demos
                            .filter((demo) => demo.category === category)
                            .map((demo) => (
                                <article className={'demo-card demo-card-' + demo.id} key={demo.id}>
                                    <div className="demo-card-art" aria-hidden="true">
                                        {demo.id === 'treasure-tiles'
                                            ? '◇ ◆ ◇'
                                            : demo.category === 'Mini games'
                                              ? '?  ?  ?'
                                              : demo.category === 'Small apps'
                                                ? '◷'
                                                : '▱ ▰ ▱'}
                                    </div>
                                    <span className="mono">{demo.load ? 'LIVE' : 'COOKBOOK CONCEPT'}</span>
                                    <h3>{demo.title}</h3>
                                    <p>{demo.challenge}</p>
                                    <p className="demo-feature">{demo.capability}</p>
                                    <a
                                        className="button secondary"
                                        href={
                                            demo.load
                                                ? '#/docs/demo-' + demo.id
                                                : '#/docs/project-cookbook#' + demo.anchor
                                        }
                                    >
                                        {demo.load ? 'Play this example →' : 'Read the concept →'}
                                    </a>
                                </article>
                            ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
