import { useId, useState } from 'react';
import { frameworks, type Examples, type Framework } from '../../examples';
import { CodeBlock } from '../molecules/CodeBlock';

export function FrameworkCode({ examples, initial = 'vanilla' }: { examples: Examples; initial?: Framework }) {
    const availableFrameworks = frameworks.filter(({ id }) => examples[id]);
    const [selected, setSelected] = useState<Framework>(() => examples[initial] ? initial : availableFrameworks[0]!.id);
    const id = useId();
    const example = examples[selected];
    return <div className="framework-code"><div role="tablist" aria-label="Code framework" className="framework-tabs">{availableFrameworks.map((framework, index) => <button key={framework.id} role="tab" id={`${id}-${framework.id}`} aria-selected={selected === framework.id} aria-controls={`${id}-panel`} tabIndex={selected === framework.id ? 0 : -1} onClick={() => setSelected(framework.id)} onKeyDown={(event) => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % availableFrameworks.length;
        else if (event.key === 'ArrowLeft') next = (index + availableFrameworks.length - 1) % availableFrameworks.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = availableFrameworks.length - 1;
        else return;
        event.preventDefault();
        const target = availableFrameworks[next]!;
        setSelected(target.id);
        document.getElementById(`${id}-${target.id}`)?.focus();
    }}>{framework.label}</button>)}</div><div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${selected}`}>{example && <CodeBlock key={selected} code={example.code} language={example.filename} />}{example?.note && <p className="snippet-note">{example.note}</p>}</div></div>;
}
