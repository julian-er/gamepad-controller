import { useEffect, useReducer, useRef } from 'react';
import type { DemoAppProps } from '../DemoShell';
const questions = [
    {
        prompt: 'Which planet has the most prominent rings?',
        answers: ['Mars', 'Saturn', 'Venus', 'Mercury'],
        correct: 1,
        note: 'Saturn’s bright rings are made mostly of ice and rock.',
    },
    {
        prompt: 'What does a prism reveal in white light?',
        answers: ['Sound waves', 'Gravity', 'A spectrum of colors', 'Magnetism'],
        correct: 2,
        note: 'Different wavelengths bend by different amounts.',
    },
    {
        prompt: 'Which animal is a mammal?',
        answers: ['Octopus', 'Penguin', 'Sea turtle', 'Dolphin'],
        correct: 3,
        note: 'Dolphins breathe air and nurse their young.',
    },
];
type State = { step: number; answer: number | null; score: number };
function advance(state: State, event: { type: 'answer'; index: number } | { type: 'next' | 'restart' }): State {
    if (event.type === 'restart') return { step: 0, answer: null, score: 0 };
    const question = questions[state.step];
    if (!question) return state;
    if (event.type === 'answer')
        return state.answer !== null
            ? state
            : { ...state, answer: event.index, score: state.score + Number(event.index === question.correct) };
    return state.answer === null ? state : { ...state, step: state.step + 1, answer: null };
}
export default function QuizNight({ session }: DemoAppProps) {
    const [state, dispatch] = useReducer(advance, { step: 0, answer: null, score: 0 });
    const root = useRef<HTMLDivElement>(null);
    const next = useRef<HTMLButtonElement>(null);
    const focusAfterTransition = useRef(false);
    const question = questions[state.step];
    useEffect(() => {
        if (!session.service || !root.current) return;
        session.service.setElements([...root.current.querySelectorAll('button')]);
    }, [session.service, state.step]);
    useEffect(() => {
        if (!session.service && !focusAfterTransition.current) return;
        focusAfterTransition.current = false;
        root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    }, [session.service, state.step]);
    useEffect(() => {
        session.service?.refresh();
        if (state.answer !== null) next.current?.focus();
    }, [session.service, state.answer]);
    useEffect(
        () =>
            session.registerAction((event) => {
                if (event.type === 'back') {
                    event.preventDefault();
                    session.logEvent('application · finish or restart this quiz');
                }
            }),
        [session.registerAction, session.logEvent]
    );
    return (
        <div className="quiz-night" ref={root}>
            <div className="quiz-score">
                <span className="mono">THE LIVING ROOM QUIZ</span>
                <strong>{state.score} / 3 points</strong>
            </div>
            {question ? (
                <>
                    <p className="quiz-progress">QUESTION {state.step + 1} OF 3</p>
                    <h2>{question.prompt}</h2>
                    <div className="quiz-answers">
                        {question.answers.map((answer, index) => (
                            <button
                                key={state.step + '-' + index}
                                disabled={state.answer !== null}
                                className={state.answer === index ? 'quiz-chosen' : ''}
                                onClick={() => dispatch({ type: 'answer', index })}
                            >
                                <span>{'ABCD'[index]}</span>
                                {answer}
                            </button>
                        ))}
                    </div>
                    <p className="quiz-feedback" role="status">
                        {state.answer === null
                            ? 'Choose your answer. One press, one decision.'
                            : (state.answer === question.correct ? 'Correct! ' : 'Good try. ') + question.note}
                    </p>
                    <button
                        ref={next}
                        className="button primary"
                        disabled={state.answer === null}
                        onClick={() => {
                            focusAfterTransition.current = true;
                            dispatch({ type: 'next' });
                        }}
                    >
                        {state.step === 2 ? 'See results' : 'Next question'}
                    </button>
                </>
            ) : (
                <div className="quiz-finale">
                    <span aria-hidden="true">✦</span>
                    <h2>That’s a wrap.</h2>
                    <p role="status">You scored {state.score} out of 3.</p>
                    <button
                        className="button primary"
                        onClick={() => {
                            session.resetInput();
                            focusAfterTransition.current = true;
                            dispatch({ type: 'restart' });
                        }}
                    >
                        Play again
                    </button>
                </div>
            )}
        </div>
    );
}
