/**
 * Date Night Dare pool.
 *
 * ⚠️ APPEND-ONLY: DateNightDare stores dareIndex, so existing weeks
 * resolve by position. Never reorder or delete — only add to the end.
 * (check-game-layer verifies count + uniqueness.)
 */

export type Dare = { title: string; description: string; duration: string };

export const DARES: Dare[] = [
  // ——— Original seed (indices 0–27) — do not touch ———
  { title: "Cook something neither of you has made before", description: "No recipes allowed. Improvise from whatever's in the kitchen.", duration: "~45 min" },
  { title: "Take a walk with no destination", description: "Put your phones away. Just walk and talk until you feel like turning back.", duration: "~30 min" },
  { title: "Watch a movie the other person picks — no complaining", description: "One of you picks something the other hasn't seen. No vetoes allowed.", duration: "~2 hours" },
  { title: "Write each other a letter by hand", description: "Old school. No texts. Deliver it in person and read yours out loud.", duration: "~20 min" },
  { title: "Find somewhere new in your neighborhood", description: "Walk or drive somewhere within 20 minutes that neither of you has been to together.", duration: "~1 hour" },
  { title: "Cook your partner's favorite meal from scratch", description: "You pick theirs, they pick yours. Eat together with no screens.", duration: "~1 hour" },
  { title: "Take photos of each other like tourists", description: "Pretend you're visiting your own city for the first time. Document the day.", duration: "~1 hour" },
  { title: "Sit somewhere and people-watch for 20 minutes", description: "A café, a park, a bench. No agenda. Just exist somewhere together.", duration: "~20 min" },
  { title: "Watch the sun set or rise together", description: "Find a good spot. No scrolling. Just be there for it.", duration: "~30 min" },
  { title: "Make a playlist for each other", description: "10 songs that remind you of them, or that you want them to hear. Share at the same time.", duration: "~30 min" },
  { title: "Do something one of you has been putting off", description: "Pick one task that's been sitting on a shared to-do list. Do it together this week.", duration: "~1 hour" },
  { title: "Eat somewhere you've never been together", description: "A new restaurant, a food truck, a place one of you has been meaning to try.", duration: "~1 hour" },
  { title: "Spend an evening offline", description: "From dinner until bed: no phones, no TV, no screens. Fill the time however you want.", duration: "~3 hours" },
  { title: "Make something with your hands together", description: "Bake, build, paint, draw, plant something. The result doesn't have to be good.", duration: "~1 hour" },
  { title: "Go somewhere in nature", description: "A trail, a lake, a park, a backyard fire. Somewhere that isn't a building.", duration: "~1-2 hours" },
  { title: "Revisit somewhere meaningful to your relationship", description: "Where you had a first date, a first trip, or a moment you remember. Go back.", duration: "~1 hour" },
  { title: "Stay in bed an extra hour on purpose", description: "No alarms, no agenda. Just lazy time together before the day starts.", duration: "~1 hour" },
  { title: "Tell each other three things you never say out loud", description: "Not appreciation — things you assume the other knows. Say them anyway.", duration: "~20 min" },
  { title: "Play a game you haven't played in years", description: "A board game, a card game, a video game, a sport. Compete or cooperate.", duration: "~1 hour" },
  { title: "Do something one of you is scared of trying", description: "Small or big. One of you nominates it, both of you show up.", duration: "Varies" },
  { title: "Give each other a full hour of undivided attention", description: "One at a time. One hour on whatever they want — talk, activity, nothing. Then switch.", duration: "~2 hours" },
  { title: "Find the best view near you", description: "Drive or walk to the highest or most scenic spot within an hour. Bring something to drink.", duration: "~1-2 hours" },
  { title: "Cook breakfast together on a weekday", description: "Wake up early enough to sit down and eat. No rushing.", duration: "~45 min" },
  { title: "Read the same article or chapter and discuss it", description: "Pick something long — a feature story, an essay, a chapter of a book. Both read it. Talk about it.", duration: "~45 min" },
  { title: "Recreate your first date as closely as you can", description: "Same place, similar food, similar energy. Notice what's different now.", duration: "~2 hours" },
  { title: "Do something physical together you've never tried", description: "A yoga class, a hike, a bike ride, swimming, dancing. Move your bodies in a new way.", duration: "~1 hour" },
  { title: "Visit a market or shop you've never been to together", description: "A farmers market, antique shop, bookstore, plant nursery. Browse with no intention to buy.", duration: "~1 hour" },
  { title: "Ask each other 5 questions you've never asked before", description: "Not 'how was your day.' Go deeper. Spend 20 minutes on each question.", duration: "~1 hour" },

  // ——— At home ———
  { title: "Build a blanket fort and watch something inside it", description: "Yes, really. Couch cushions, fairy lights if you have them. Snacks mandatory.", duration: "~2 hours" },
  { title: "Have a candlelit dinner at your own table", description: "Whatever you're eating — even leftovers. Candles, real plates, phones in another room.", duration: "~1 hour" },
  { title: "Teach each other something in 30 minutes", description: "A skill, a game, a recipe, a party trick. You each get half an hour as the teacher.", duration: "~1 hour" },
  { title: "Do a puzzle you can't finish in one night", description: "500+ pieces. Leave it out all week and chip away at it together.", duration: "All week" },
  { title: "Make cocktails or mocktails for each other", description: "Invent one and name it after the other person. Taste-test and rate them.", duration: "~45 min" },
  { title: "Swap chores for the week", description: "You do theirs, they do yours. Compare notes on Sunday about how the other half lives.", duration: "All week" },
  { title: "Have breakfast for dinner", description: "Pancakes at 8pm. Pajamas required. Bonus points for bacon.", duration: "~1 hour" },
  { title: "Interview each other on camera for 10 minutes", description: "Ask about this exact season of life. Save the video somewhere you'll find it in five years.", duration: "~30 min" },
  { title: "Make a time capsule for your future selves", description: "A box or an envelope: notes, a photo, a receipt, a prediction. Date it and hide it for 2 years.", duration: "~45 min" },
  { title: "Rearrange one room together", description: "Move the furniture. Try the bed on the other wall. Live dangerously.", duration: "~1 hour" },
  { title: "Bake something from a family recipe", description: "One of yours or one of theirs. Call the relative who makes it best if you need help.", duration: "~1.5 hours" },
  { title: "Have a two-person book club night", description: "Each bring one passage, poem, or paragraph you love. Read them aloud and say why.", duration: "~45 min" },
  { title: "Plan your dream trip like it's real", description: "Pick dates, look up flights, choose the hotel, plan day one. Save the itinerary — someday it's happening.", duration: "~1 hour" },
  { title: "Do face masks and rate your week", description: "Self-care night. While the masks set, each share the high, the low, and the weird of the week.", duration: "~45 min" },

  // ——— Out & about ———
  { title: "Take the couple's photo booth challenge", description: "Find a photo booth (or make one with a timer). Four frames: happy, dramatic, in love, ridiculous.", duration: "~30 min" },
  { title: "Go somewhere with live music", description: "A bar band, an open mic, a symphony, a busker. Stay for the whole set.", duration: "~2 hours" },
  { title: "Have a $10 date", description: "Ten dollars total, spent on the date. Get creative. Report what you got away with.", duration: "~2 hours" },
  { title: "Let a coin flip plan your evening", description: "At every decision point — left or right, this place or that one — flip for it. Follow the coin.", duration: "~2 hours" },
  { title: "Visit the closest tourist attraction you've never done", description: "The thing visitors do that you've always skipped. Be tourists in your own town.", duration: "~2 hours" },
  { title: "Take a class together on a whim", description: "Pottery, salsa, rock climbing intro, life drawing — whatever's bookable this week.", duration: "~2 hours" },
  { title: "Do a photo scavenger hunt", description: "Each write 5 things to find ('something older than us', 'the best door'). Trade lists, hunt, compare.", duration: "~1.5 hours" },
  { title: "Eat three courses at three places", description: "Appetizer at one spot, main at another, dessert at a third. Walk between them.", duration: "~3 hours" },
  { title: "Go to a bookstore and pick a book for each other", description: "Budget or no budget. Something you think they'd love — or something that IS them. Explain your choice.", duration: "~1 hour" },
  { title: "Watch planes, trains, or boats leave", description: "Airport cell lot, train platform, harbor. Make up stories about where everyone's going.", duration: "~1 hour" },
  { title: "Have a proper picnic", description: "Blanket, real food, no rushing. If the weather's bad, picnic on the living room floor.", duration: "~2 hours" },
  { title: "Ride something — ferris wheel, carousel, gondola", description: "Anything that moves slowly and has a view. Act like it's a big deal.", duration: "~1 hour" },
  { title: "Try the couple's gym or run date", description: "Work out together once this week. Spot each other. Race the last stretch.", duration: "~1 hour" },
  { title: "Volunteer together for a morning", description: "Food bank, animal shelter, park cleanup. Two sets of hands, one good deed.", duration: "~3 hours" },

  // ——— Talk & connect ———
  { title: "Trade phones and pick each other's photos", description: "Each choose your 5 favorite photos from the other's camera roll. Explain your picks.", duration: "~30 min" },
  { title: "Draw each other's portrait in 10 minutes", description: "No erasing, no artistic talent required. Frame the results — or at least stick them on the fridge.", duration: "~30 min" },
  { title: "Write your couple bucket list", description: "25 things, big and small. Star three to do this year. Keep the list where you'll see it.", duration: "~45 min" },
  { title: "Tell the story of how you met — to each other", description: "Take turns, full detail, from your own point of view. Notice where the versions differ.", duration: "~30 min" },
  { title: "Ask each other the same question every hour", description: "Pick one ('what are you thinking about?'). Ask it every hour for a day, wherever you are.", duration: "All day" },
  { title: "Plan each other's perfect day", description: "Separately design the other's ideal Saturday, start to finish. Reveal the plans. Do one of them soon.", duration: "~30 min" },
  { title: "Make a map of your relationship", description: "Draw it: where you met, first date, first trip, where you live. Mark it all on one page.", duration: "~45 min" },
  { title: "Have a no-small-talk dinner", description: "One rule at the table: nothing about work, chores, or logistics. See where it goes.", duration: "~1 hour" },
  { title: "Say thank you for three invisible things", description: "Not gifts or favors — the unnoticed stuff. The way they check the locks. How they always text back.", duration: "~20 min" },
  { title: "Predict each other's answers, then check", description: "Write 5 predictions about their favorites and fears. Read them aloud and get graded.", duration: "~30 min" },

  // ——— Playful & silly ———
  { title: "Have a two-person game tournament", description: "Best of five: cards, rock-paper-scissors, thumb war, a video game, coin toss. Winner picks dessert.", duration: "~1 hour" },
  { title: "Cook with a secret ingredient", description: "Each secretly add one ingredient to a shared dish. Guess what the other snuck in.", duration: "~1 hour" },
  { title: "Speak in accents for an entire errand", description: "Commit from door to door. First one to break buys the treat on the way home.", duration: "~1 hour" },
  { title: "Recreate a photo from early in your relationship", description: "Same pose, same expressions, same spot if you can manage it. Put them side by side.", duration: "~1 hour" },
  { title: "Have a dance party for exactly three songs", description: "Kitchen, living room, garage. Each pick one song, then one you both love. Full commitment.", duration: "~15 min" },
  { title: "Do each other's 'jobs' for one task", description: "They parallel park. You do the thing only they know how to do. Coach each other through it.", duration: "~30 min" },
  { title: "Build the weirdest sandwich and share it", description: "Each add alternating ingredients, no vetoes. You both have to eat half.", duration: "~30 min" },
  { title: "Hide three notes for each other to find", description: "Around the house, in a coat pocket, in a lunch bag. Discover them over the week.", duration: "All week" },
  { title: "Thumb-wrestle for real stakes", description: "Best of seven. Loser does the dishes for three days. No mercy.", duration: "~10 min" },
  { title: "Reenact your favorite movie scene", description: "Props optional, commitment mandatory. Film it or let it be lost to history.", duration: "~30 min" },
  { title: "Stargaze for twenty unhurried minutes", description: "Backyard, balcony, or the hood of the car. Find one constellation — or invent one and name it after you two.", duration: "~30 min" },
  { title: "Make each other's favorite childhood snack", description: "The weird thing you loved at eight years old. Trade, taste, and defend your choices.", duration: "~45 min" },
  { title: "Do a blind taste test", description: "One of you blindfolded, five mystery bites. Then switch. Score for accuracy and drama.", duration: "~30 min" },
  { title: "Walk to somewhere you usually drive", description: "The coffee shop, the store, the restaurant. Notice everything you normally miss at 40mph.", duration: "~1 hour" },
];
