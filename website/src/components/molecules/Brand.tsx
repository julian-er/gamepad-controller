import { Icon } from '../atoms/Icon';

export function Brand() {
    return <a className="brand" href="#/"><span className="brand-icon"><Icon /></span><span>gamepad<span className="brand-divider">-</span>ui<span className="brand-divider">-</span>controller<span className="brand-dot">.</span></span></a>;
}
