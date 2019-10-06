import React from "react";
import faker from "faker";

import "./App.css";

function createArticle() {
  return {
    id: faker.random.uuid(),
    title: faker.lorem.words(5),
    paragraphs: Array(6)
      .fill(null)
      .map(_ => faker.lorem.paragraph(15))
  };
}

export default function App() {
  // eslint-disable-next-line
  const [_tick, setTick] = React.useState(null);
  const [articles, setArticles] = React.useState([]);
  const [timers, setTimers] = React.useState({});
  const [bottom, setBottom] = React.useState(null);
  const bottomObserver = React.useRef(null);
  const paragraphObserver = React.useRef(null);

  // Using the tick to force a re-render
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick(new Date());
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Track timers for each paragraph's visibility
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          setTimers(timers => {
            const id = entry.target.dataset.id;
            const timer = timers[id] || {
              total: 0,
              start: null
            };

            if (entry.isIntersecting) {
              // Start the timer
              timer.start = new Date();
            } else if (timer.start) {
              // Stop the timer and add to the total
              timer.total += new Date().getTime() - timer.start.getTime();
              timer.start = null;
            }

            return { ...timers, [id]: timer };
          });
        });
      },
      { threshold: 0.75 }
    );
    paragraphObserver.current = observer;
  }, []);

  // Detect when to load additional articles
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setArticles(articles => {
          if (entry.isIntersecting) {
            return [...articles, createArticle()];
          } else {
            return articles;
          }
        });
      },
      { threshold: 0.25, rootMargin: "50px" }
    );
    bottomObserver.current = observer;
  }, []);

  // Observe the bottom detection div
  React.useEffect(() => {
    const observer = bottomObserver.current;
    if (bottom) {
      observer.observe(bottom);
    }
    return () => {
      if (bottom) {
        observer.unobserve(bottom);
      }
    };
  }, [bottom]);

  return (
    <main>
      <ul>
        {articles.map(article => (
          <li key={article.id}>
            <h2>{article.title}</h2>

            {article.paragraphs.map((paragraph, i) => {
              const key = `${article.id}|${i}`;
              return (
                <Paragraph
                  key={key}
                  text={paragraph}
                  paragraphId={key}
                  observer={paragraphObserver.current}
                  timer={
                    timers[key] || {
                      total: 0,
                      start: null
                    }
                  }
                />
              );
            })}
          </li>
        ))}
      </ul>

      <div ref={setBottom}>loading...</div>
    </main>
  );
}

function Paragraph({ text, paragraphId, observer, timer }) {
  // Track the ref to the paragraph being rendered
  const [ref, setRef] = React.useState(null);

  // Observe and unobserve this paragraph
  React.useEffect(() => {
    if (ref) {
      observer.observe(ref);
    }
    return () => {
      if (ref) {
        observer.unobserve(ref);
      }
    };
  }, [observer, ref]);

  // Calculate total time displayed for this paragraph
  let total = timer.total;
  // The paragraph is active when it has a start time
  const active = timer.start ? true : false;
  if (active) {
    // If it is still active, add the current time to the previous total
    total += new Date().getTime() - timer.start.getTime();
  }
  // Converting milliseconds to seconds
  const seconds = (total / 1000).toFixed(1);

  // Finally time to render the actual paragraph element
  return (
    <p
      ref={setRef}
      data-id={paragraphId}
      className={active ? "active" : "inactive"}
    >
      <span className="timer">{seconds}s</span>
      {text}
    </p>
  );
}
