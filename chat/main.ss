+ {^hasTag('hello')} *~2
- Hi!
- Hi, how are you?
- How are you?
- Hello
- Howdy
- Ola
- Gazurkelpoodlin
- paddoodle

+ * weather in <name>
- ^getWeather(<cap1>)


+ i go by (bus|train|car)
- that's great


+ i ~like ~sport
- good for you that you like that

+ my [big] red balloon [is awesome]
- glad you have one

/*
+ conversation
- What is your name?

+ [my name is] *1
% * what is your name
- So your first name is <cap1>?

+ ~yes
% so your first name is *
- Okay good.

+ *
% so your first name is *
- Oh, lets try this again... {@conversation}

+ *
% * what is your name
- I don't get it. {@conversation}

+ *
- Let's talk about something else now. {topic=sports}
*/

