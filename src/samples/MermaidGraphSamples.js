const mermaidSampleNames = [
  "流程图", // index 0
  "时序图", // index 1
  "类图", // index 2
  "状态图",
  "关系图",
  "旅程图",
  "甘特图",
  "饼状图",
  "思维导图",
  "时间轴",
];

const mermaidSampleCodes = [
  `  \n\`\`\`mermaid
graph TD
Start --> Stop
\`\`\`  \n`,

  `  \n\`\`\`mermaid
sequenceDiagram
Alice->>John: Hello John, how are you?
John-->>Alice: Great!
Alice-)John: See you later!
\`\`\`  \n`,

  `  \n\`\`\`mermaid
classDiagram
Animal <|-- Duck
Animal : +int age
Animal : +String gender
Animal: +isMammal()
Animal: +mate()
class Duck{
+String beakColor
+swim()
+quack()
}
\`\`\`  \n`,

  `  \n\`\`\`mermaid
stateDiagram-v2
[*] --> Still
Still --> [*]

Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]
\`\`\`  \n`,

  `  \n\`\`\`mermaid
erDiagram
CUSTOMER ||--o{ ORDER : places
ORDER ||--|{ LINE-ITEM : contains
CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
\`\`\`  \n`,

  `  \n\`\`\`mermaid
journey
title My working day
section Go to work
Make tea: 5: Me
Go upstairs: 3: Me
Do work: 1: Me, Cat
section Go home
Go downstairs: 5: Me
Sit down: 5: Me
\`\`\`  \n`,

  `  \n\`\`\`mermaid
gantt
title A Gantt Diagram
dateFormat  YYYY-MM-DD
section Section
A task           :a1, 2014-01-01, 30d
Another task     :after a1  , 20d
section Another
Task in sec      :2014-01-12  , 12d
another task      : 24d
\`\`\`  \n`,

  `  \n\`\`\`mermaid
pie title Pets adopted by volunteers
"Dogs" : 386
"Cats" : 85
"Rats" : 15
\`\`\`  \n`,

  `  \n\`\`\`mermaid
mindmap
      Root
          A
            B
            C
    
\`\`\`  \n`,

  `  \n\`\`\`mermaid
timeline
      title History of Social Media Platform
      2002 : LinkedIn
      2004 : Facebook
           : Google
      2005 : Youtube
      2006 : Twitter
      
\`\`\`  \n`,
];

export { mermaidSampleNames, mermaidSampleCodes };
