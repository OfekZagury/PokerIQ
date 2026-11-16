// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Login.jsx";

const LESSON_COUNT = 24;

// Each lesson page is loaded on demand, so the first load stays small.
const lessonModules = import.meta.glob("./Pages/Game*.jsx");
const lessons = Array.from({ length: LESSON_COUNT }, (_, i) => {
  const id = i + 1;
  return { id, Component: lazy(lessonModules[`./Pages/Game${id}.jsx`]) };
});

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading lesson…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {lessons.map((lesson) => {
            const LessonPage = lesson.Component;
            return <Route key={lesson.id} path={`/game${lesson.id}`} element={<LessonPage />} />;
          })}
        </Routes>
      </Suspense>
    </Layout>
  );
}
