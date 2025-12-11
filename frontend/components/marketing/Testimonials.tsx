import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    handle: "@alexcreates",
    avatar: "A",
    content:
      "TubeGrow's AI insights helped me understand why some videos flopped. Changed my thumbnail strategy and saw a 40% increase in CTR!",
    subscribers: "125K subscribers",
  },
  {
    name: "Sarah Martinez",
    handle: "@sarahvlogs",
    avatar: "S",
    content:
      "The viral clip generator is a game-changer. I used to spend hours editing Shorts. Now I can identify the best moments in minutes.",
    subscribers: "89K subscribers",
  },
  {
    name: "Mike Johnson",
    handle: "@miketech",
    avatar: "M",
    content:
      "Finally, analytics that actually tell me what to do! The AI assistant answered questions I didn't even know to ask.",
    subscribers: "312K subscribers",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Loved by Creators
          </h2>
          <p className="text-gray-400">
            See what creators are saying about TubeGrow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[#111] border border-white/10 rounded-xl p-6"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6">&ldquo;{testimonial.content}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-white font-medium">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">
                    {testimonial.handle} · {testimonial.subscribers}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
