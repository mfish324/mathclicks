/**
 * Fun, encouraging comments based on math topics and standards.
 * Includes dad jokes, puns, and real-world connections.
 */

interface TopicComments {
  encouragements: string[];
  realWorld: string[];
  dadJokes: string[];
}

const topicComments: Record<string, TopicComments> = {
  // Ratios and Proportions
  "ratio": {
    encouragements: [
      "Ratios are the secret sauce of math! You're cooking now!",
      "You're really getting the ratio of success to awesome here!",
      "Ratios help you see relationships everywhere - you're becoming a math detective!",
    ],
    realWorld: [
      "Ratios help you mix the perfect lemonade - not too sweet, not too sour!",
      "Video game designers use ratios to balance characters. You could design games someday!",
      "Maps use ratios to shrink the whole world onto paper. Pretty cool, right?",
    ],
    dadJokes: [
      "Why did the ratio go to therapy? It had too many proportional issues!",
      "I tried to write a ratio joke, but I couldn't find the right proportion of humor.",
      "Ratios are great - they really know how to relate!",
    ],
  },
  "proportion": {
    encouragements: [
      "Proportions are your superpower for scaling anything up or down!",
      "You're learning to think proportionally - that's a big deal!",
      "Master proportions and you'll never be tricked by a 'sale' again!",
    ],
    realWorld: [
      "Proportions help you double a recipe when your whole family wants muffins!",
      "Artists use proportions to draw realistic people. Your art could level up!",
      "Proportions help architects build tiny models of huge buildings!",
    ],
    dadJokes: [
      "Why are proportions so trustworthy? They always keep things in balance!",
      "I told my friend a proportion joke. They said it was equally funny.",
      "Proportions never argue - they just see eye to eye!",
    ],
  },
  // Fractions
  "fraction": {
    encouragements: [
      "Fractions are just numbers being shared fairly - and you're sharing the knowledge!",
      "You're crushing these fractions into tiny, manageable pieces!",
      "Every fraction master started exactly where you are!",
    ],
    realWorld: [
      "Fractions help you split a pizza so everyone gets their fair share!",
      "Musicians use fractions for time signatures - fractions make music possible!",
      "Carpenters use fractions every day to measure and cut wood perfectly!",
    ],
    dadJokes: [
      "Why was the fraction worried about marrying the decimal? Because they would have to convert!",
      "5/4 of people admit they're bad at fractions.",
      "I have strong opinions about fractions. You could say I'm partial to them!",
    ],
  },
  // Decimals
  "decimal": {
    encouragements: [
      "Decimals are just fractions in disguise - and you're seeing through the mask!",
      "You're really on point with these decimals!",
      "Decimal mastery unlocked! You're moving up in the math world!",
    ],
    realWorld: [
      "Decimals are how money works - you're learning to count cash like a pro!",
      "Scientists use decimals to measure things super precisely!",
      "Your batting average in baseball? That's a decimal! Sports love math!",
    ],
    dadJokes: [
      "Why don't decimals ever win arguments? They always have a point but never a whole one!",
      "Decimals are great at parties - they really know how to break things down!",
      "I'd tell you a decimal joke, but it's only 0.5 funny.",
    ],
  },
  // Percentages
  "percent": {
    encouragements: [
      "Percentages are everywhere - now you'll see them all around you!",
      "You're giving 100% effort and it shows!",
      "Learning percentages is a skill you'll use literally forever!",
    ],
    realWorld: [
      "Percentages help you figure out if that 30% off sale is actually a good deal!",
      "Your phone battery? That's a percentage! Now you understand it better!",
      "Tips at restaurants use percentages - you'll never stress about the math again!",
    ],
    dadJokes: [
      "Why did 100% break up with 50%? It wanted someone more whole!",
      "I'm 100% sure that 50% of my jokes are about percentages.",
      "Percentages are always so dramatic - everything's out of 100 with them!",
    ],
  },
  // Algebra / Equations
  "equation": {
    encouragements: [
      "Equations are puzzles, and you're becoming a puzzle master!",
      "Solving equations is like being a detective - find that mystery number!",
      "Every equation you solve makes the next one easier!",
    ],
    realWorld: [
      "Video game physics use equations to make things look realistic!",
      "Equations help engineers build bridges that don't fall down!",
      "Your GPS uses equations to find the fastest route!",
    ],
    dadJokes: [
      "Why was the equal sign so humble? Because it knew it wasn't less than or greater than anyone else!",
      "Equations are like relationships - you have to balance both sides!",
      "I tried to solve an equation about plants. It had too many roots!",
    ],
  },
  "variable": {
    encouragements: [
      "Variables are like mystery boxes - and you're opening them!",
      "Using letters in math? That's next-level stuff and you're doing it!",
      "Variables make you think like a real mathematician!",
    ],
    realWorld: [
      "Programmers use variables all day long - this is coding prep!",
      "Variables help scientists write formulas that work for any situation!",
      "Game designers use variables to track your score, health, and inventory!",
    ],
    dadJokes: [
      "Why did X break up with Y? There were too many unknowns in the relationship!",
      "Variables walk into a bar. The bartender asks 'What can I get you?' They say 'It depends.'",
      "My favorite variable is X - it marks the spot!",
    ],
  },
  // Geometry
  "angle": {
    encouragements: [
      "You're really looking at this from all angles!",
      "Angles are everywhere once you start noticing them!",
      "You're acute learner! (Get it? Acute? Okay, I'll stop.)",
    ],
    realWorld: [
      "Pool players use angles to plan trick shots!",
      "Skateboarders need to know angles for ramps and tricks!",
      "Architects use angles to design buildings that look amazing!",
    ],
    dadJokes: [
      "Why was the angle always so calm? It never went past 90 degrees!",
      "I tried to make a belt out of watches. It was a waist of time. Wait, wrong joke... angles are acute subject though!",
      "Obtuse angles are never sharp, but they have a lot of depth!",
    ],
  },
  "triangle": {
    encouragements: [
      "Triangles are the strongest shape in nature - and your skills are getting stronger!",
      "Three sides, three angles, endless possibilities!",
      "You're really shaping up with these triangles!",
    ],
    realWorld: [
      "Bridges use triangles because they're super strong!",
      "The Bermuda Triangle is famous - but regular triangles are way more useful!",
      "Pizza slices are triangles - math you can eat!",
    ],
    dadJokes: [
      "Why did the triangle break up with the circle? The circle was too pointless!",
      "What did the triangle say to the circle? You're so pointless!",
      "Triangles are great musicians - they really know how to play the angles!",
    ],
  },
  "area": {
    encouragements: [
      "You're covering a lot of ground with area! (Pun intended!)",
      "Area is all about filling space - and you're filling your brain with knowledge!",
      "Mastering area means you'll never buy too much paint or carpet!",
    ],
    realWorld: [
      "Area helps you figure out how much paint to buy for your room!",
      "Farmers use area to know how much seed they need for their fields!",
      "Area tells you if that rug will actually fit in your room!",
    ],
    dadJokes: [
      "Why was the geometry teacher so good at gardening? She knew all about area!",
      "I tried to calculate the area of my problems, but they were too irregular!",
      "Area jokes really cover a lot of ground!",
    ],
  },
  "perimeter": {
    encouragements: [
      "Walking the perimeter of math success!",
      "Perimeter is like giving a shape a hug - measure all around!",
      "You're really going the distance with perimeter!",
    ],
    realWorld: [
      "Perimeter tells you how much fence you need for a yard!",
      "Track runners know their perimeter - that's how far they run each lap!",
      "Picture frames are all about perimeter!",
    ],
    dadJokes: [
      "Why did the shape go for a walk? To check its perimeter!",
      "Perimeter jokes really go around!",
      "I walked around a rectangle. It was a very edgy experience!",
    ],
  },
  // Expressions
  "expression": {
    encouragements: [
      "Expressions are math's way of telling stories!",
      "You're really expressing yourself mathematically!",
      "Building expressions is like building with LEGO - one piece at a time!",
    ],
    realWorld: [
      "Expressions help programmers write code that works!",
      "Spreadsheets use expressions to calculate everything automatically!",
      "Scientists use expressions to describe how the universe works!",
    ],
    dadJokes: [
      "Why did the expression look so serious? It had too many terms to deal with!",
      "Math expressions aren't very good at poker - they always show their values!",
      "I wrote an expression about bread. It was pretty crumby!",
    ],
  },
  // Integers / Negative Numbers
  "integer": {
    encouragements: [
      "Integers include negatives - you're going below zero and beyond!",
      "Negative numbers might seem backwards, but you're moving forward!",
      "You're positively great at integers! (Even the negative ones!)",
    ],
    realWorld: [
      "Temperature goes negative - that's integers keeping you informed!",
      "Bank accounts can go negative - integers help you track money!",
      "Elevators go to basement levels - negative floor numbers!",
    ],
    dadJokes: [
      "Why are negative numbers so lonely? They're always less than zero friends!",
      "I asked a negative number if it was positive. It said 'I'm negative about that.'",
      "Negative numbers are never positive, but they're not irrational either!",
    ],
  },
  // Coordinate Plane
  "coordinate": {
    encouragements: [
      "Coordinates help you find anything anywhere!",
      "You're plotting your course to math mastery!",
      "X marks the spot - and you're finding all the spots!",
    ],
    realWorld: [
      "GPS uses coordinates to find any location on Earth!",
      "Video games use coordinates to know where your character is!",
      "Treasure maps use coordinates - X marks the spot!",
    ],
    dadJokes: [
      "Why did the point go to the coordinate plane? It needed some direction in life!",
      "I told my GPS a joke about coordinates. It didn't get the point!",
      "Coordinates are great at parties - they always know where to be!",
    ],
  },
  // Statistics
  "mean": {
    encouragements: [
      "Finding the mean is finding the balance - you're a math balancer!",
      "The mean might sound mean, but it's actually very fair!",
      "Averaging out to be a great math student!",
    ],
    realWorld: [
      "Your grade point average? That's a mean! Now you know how it works!",
      "Sports stats use means all the time - batting averages, points per game!",
      "Scientists use means to understand what's 'typical' in their data!",
    ],
    dadJokes: [
      "Why was the mean so average? Because that's literally what it is!",
      "I calculated the mean of my jokes. It was average.",
      "The mean isn't mean - it's actually quite fair!",
    ],
  },
  "probability": {
    encouragements: [
      "Probability helps you predict the future - kind of like math magic!",
      "What are the odds you'd be this good? Pretty high!",
      "You're probably going to master this! (See what I did there?)",
    ],
    realWorld: [
      "Weather forecasts use probability - that's why they say '70% chance of rain'!",
      "Card games are all about probability - now you'll have an edge!",
      "Insurance companies use probability to set prices!",
    ],
    dadJokes: [
      "Why did the probability student fail? There was only a 50% chance they'd study!",
      "Probability jokes are hit or miss. Mostly miss, probably.",
      "I'd tell you a probability joke, but there's only a small chance you'd laugh!",
    ],
  },
};

// Common standards mapping to topics
const standardsToTopic: Record<string, string> = {
  // Ratios and Proportional Relationships
  "6.RP": "ratio",
  "7.RP": "proportion",
  // Number System
  "6.NS": "decimal",
  "7.NS": "integer",
  "8.NS": "integer",
  // Expressions and Equations
  "6.EE": "expression",
  "7.EE": "equation",
  "8.EE": "equation",
  // Geometry
  "6.G": "area",
  "7.G": "angle",
  "8.G": "triangle",
  // Statistics and Probability
  "6.SP": "mean",
  "7.SP": "probability",
  "8.SP": "probability",
  // Functions
  "8.F": "variable",
};

/**
 * Get a fun comment based on the topic and/or standards
 */
export function getFunComment(topic: string, standards: string[]): { message: string; type: "encouragement" | "realWorld" | "dadJoke" } {
  // Find matching topic from the topic string
  const topicLower = topic.toLowerCase();
  let matchedTopic: string | null = null;

  // Direct topic match
  for (const key of Object.keys(topicComments)) {
    if (topicLower.includes(key)) {
      matchedTopic = key;
      break;
    }
  }

  // Try to match from standards if no direct topic match
  if (!matchedTopic && standards.length > 0) {
    for (const standard of standards) {
      // Extract the standard prefix (e.g., "7.RP" from "7.RP.A.2")
      const prefix = standard.split(".").slice(0, 2).join(".");
      if (standardsToTopic[prefix]) {
        matchedTopic = standardsToTopic[prefix];
        break;
      }
    }
  }

  // Default to a generic encouraging comment if no match
  if (!matchedTopic) {
    const genericComments = [
      { message: "Math is like a puzzle, and you're putting the pieces together!", type: "encouragement" as const },
      { message: "Every problem you solve makes your brain stronger!", type: "encouragement" as const },
      { message: "Why did the math book look sad? It had too many problems! But you're solving them!", type: "dadJoke" as const },
      { message: "Math helps you think logically - that's a superpower in any career!", type: "realWorld" as const },
    ];
    return genericComments[Math.floor(Math.random() * genericComments.length)];
  }

  const comments = topicComments[matchedTopic];

  // Randomly choose between encouragement, real-world, or dad joke (weighted)
  const rand = Math.random();
  if (rand < 0.35) {
    return {
      message: comments.encouragements[Math.floor(Math.random() * comments.encouragements.length)],
      type: "encouragement",
    };
  } else if (rand < 0.7) {
    return {
      message: comments.realWorld[Math.floor(Math.random() * comments.realWorld.length)],
      type: "realWorld",
    };
  } else {
    return {
      message: comments.dadJokes[Math.floor(Math.random() * comments.dadJokes.length)],
      type: "dadJoke",
    };
  }
}
