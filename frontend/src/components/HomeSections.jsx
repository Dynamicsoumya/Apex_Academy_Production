import React, { useState } from "react";

const TEAM = [
  {
    name: "Mr. Suryakant Lenka",
    role: "Founder",
    image: "/images/founder.jpeg",
    bio: "Dedicated educator committed to shaping young minds and fostering academic excellence at Apex Academy.",
  },
  {
    name: "Mr. Subhrakanta Biswal",
    role: "Co-Founder",
    image: "/images/cofounder.jpeg",
    bio: "Passionate mentor focused on conceptual learning and student success at Apex Academy.",
  },
];

const VIDEOS = [
  {
    id: "math",
    title: "Mathematics — Trigonometry Basics",
    subject: "Mathematics",
    duration: "45 min",
    thumbnail: "/images/video-math.png",
    youtubeId: "PJ010MHrzjA",
    desc: "Clear explanation of sin, cos, tan with board exam shortcuts.",
  },
  {
    id: "physics",
    title: "Physics — Laws of Motion",
    subject: "Physics",
    duration: "38 min",
    thumbnail: "/images/video-physics.png",
    youtubeId: "1WaV2x8GXjU",
    desc: "Newton's laws explained with real-life examples and numericals.",
  },
  {
    id: "chemistry",
    title: "Chemistry — Organic Reactions",
    subject: "Chemistry",
    duration: "52 min",
    thumbnail: "/images/video-chemistry.png",
    youtubeId: "B_ketdzJtY8",
    desc: "Master name reactions and mechanisms for 12th board exams.",
  },
  {
    id: "biology",
    title: "Biology — Human Physiology",
    subject: "Biology",
    duration: "41 min",
    thumbnail: "/images/video-biology.png",
    youtubeId: "Q0p8WuMjsCA",
    desc: "Digestive & circulatory system — NEET-focused revision.",
  },
];

const ACHIEVEMENTS = [
  { value: "500+", label: "Students Enrolled" },
  { value: "95%", label: "Pass Rate" },
  { value: "50+", label: "Expert Faculty" },
  { value: "10+", label: "Years Experience" },
];

export default function TeamSection() {
  return (
    <section className="section team-section">
      <div className="section-header">
        <p className="section-eyebrow">LEADERSHIP</p>
        <h2>Meet Our Founder & Co-Founder</h2>
        <p className="section-sub">Experienced educators dedicated to your academic success</p>
      </div>
      <div className="team-grid">
        {TEAM.map((person) => (
          <div className="team-card" key={person.name}>
            <div className="team-photo-wrap">
              <img src={person.image} alt={person.name} className="team-photo" loading="lazy" />
              <div className="team-photo-badge">{person.role.split(" & ")[0]}</div>
            </div>
            <div className="team-info">
              <h3>{person.name}</h3>
              <span className="team-role">{person.role}</span>
              <span className="team-subjects">{person.subjects}</span>
              <p>{person.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VideoSection() {
  const [activeVideo, setActiveVideo] = useState(VIDEOS[0]);

  return (
    <section className="section videos-section">
      <div className="section-header">
        <p className="section-eyebrow">FREE PREVIEW</p>
        <h2>Coaching Video Lectures</h2>
        <p className="section-sub">
          Watch sample classes — full PDF notes & video lectures for Class 9th, 10th, 11th & 12th on your dashboard
        </p>
      </div>

      <div className="video-showcase">
        <div className="video-player-wrap">
          <div className="video-player">
            <iframe
              title={activeVideo.title}
              src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="video-now-playing">
            <span className="now-playing-badge">▶ Now Playing</span>
            <h3>{activeVideo.title}</h3>
            <p>{activeVideo.desc}</p>
          </div>
        </div>

        <div className="video-list">
          {VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`video-thumb-card ${activeVideo.id === v.id ? "active" : ""}`}
              onClick={() => setActiveVideo(v)}
            >
              <div className="video-thumb-img">
                <img src={v.thumbnail} alt={v.title} loading="lazy" />
                <span className="play-icon">▶</span>
                <span className="video-duration">{v.duration}</span>
              </div>
              <div className="video-thumb-info">
                <span className="video-subject-tag">{v.subject}</span>
                <h4>{v.title}</h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SuccessSection() {
  return (
    <section className="achievements-bar">
      <div className="achievements-inner">
        {ACHIEVEMENTS.map((a) => (
          <div className="achievement-item" key={a.label}>
            <strong>{a.value}</strong>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
