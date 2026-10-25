# Character artwork

Generated animated-film character sprites and procedural stadium and ball artwork load locally. All characters—including the Celtic boy, the Rangers opponents across varied positions and body types, and Toby the Wonderdog—share a cohesive, high-end 3D animated CGI feature film cartoon style (Pixar/Illumination aesthetic) with stylized cartoon proportions, expressive cartoon eyes, and rounded forms.

## dog-actions.png

A 2D video game character sprite sheet atlas showing 8 sequential animation poses arranged in a clean 4-column by 2-row grid on transparent alpha. Rendered in 3D animated feature film CGI style matching the Celtic boy character. The character is Toby the Wonderdog: an athletic cartoon Ruby Cavalier King Charles Spaniel with rich chestnut-red coat, long wavy silky feathered ears, fluffy feathered tail, warm dark eyes, and a cute black nose (a natural dog with no clothes or hats), referencing the user's Toby photo. All poses face screen RIGHT. Top row: 4-frame running and sprinting cycle charging fast across the pitch. Bottom row: airborne flying tackle leap, low sliding tackle, tumble recovery roll, and joyful standing bark.

## cartoon-rangers-actions (zombie-actions.png)

A stylized 3D cartoon Scottish youth midfielder strictly matching the Pixar/Illumination aesthetic, oversized expressive head, and cartoon proportions of the main boy in `boy-run.png`. In royal-blue Rangers kit with white trim, white shorts, black socks with red trim, and blue cleats. Exactly 8 poses in an evenly spaced 4×2 grid facing screen RIGHT: 4-frame running cycle, crouched tackle windup, low sliding tackle along the turf, startled cartoon recoil stumbling backwards in surprise, and comical dazed seated knock-down pose.

## cartoon-rangers-variants (enemy-variants.png)

A 6-column by 2-row atlas featuring two distinct cartoon Rangers defenders matching the main boy's cartoon universe and rendering:
- **Top row: The Bruiser** - a broad, stocky, comical cartoon kid defender with a chunky rounded build, round cheeks, buzzcut hair, big cartoon eyes, and determined grin.
- **Bottom row: The Tower** - a tall, lanky, comical cartoon kid defender with long springy limbs, curly dark mop of hair, and big expressive cartoon eyes.
Both wear royal-blue shirts and white shorts. Each row features 2 confident cartoon walks, 2 visibly exhausted hunched walks (panting with sweat droplets), a low sliding tackle, and knocked out lying flat on the turf.

## finale-poses.png

A 2×2 grid showing:
- **Top row**: The Celtic boy from behind in green-and-white hooped jersey with green number 7 (ready stance and kicking follow-through).
- **Bottom row**: A comical, athletic cartoon youth goalkeeper matching the boy's cartoon style, wearing a purple long-sleeve goalkeeper jersey, black shorts, purple socks, and oversized cream padded gloves (front-on ready crouch with gloves spread wide, and diving horizontally to his right for a dramatic save).

## boy-run.png

Use case: stylized-concept. Asset type: production game sprite atlas on a genuinely transparent background. Reference image role: visual style only — rounded, polished 3D animated-film children, expressive large eyes, soft detailed shading, appealing hair and cloth materials. Create ONE 4-column by 2-row sprite sheet, exactly 8 full-body poses of the SAME boy footballer, evenly spaced in 8 equal rectangular cells, with generous transparent margins, no touching/overlap. Every pose faces screen RIGHT in a consistent side/three-quarter view, identical camera and scale, full head and boots visible. Boy design: fair rosy skin, swept sandy/light-brown quiff with short sides, bright blue eyes, cheerful toothy smile, around 9 years old. He wears Celtic green-and-white horizontal hooped short-sleeve jersey, white shorts, white socks with green bands and orange football boots. Child proportions with oversized expressive head. No hat. No football (ball is animated separately). Top row is 4 successive running poses; bottom row is next 4 running poses, creating one complete smooth running cycle. Strong readable running silhouettes, alternating arms and legs, proper bent knees and ankles. Same face, hair, outfit and proportions in all 8 frames. Clean studio key light from upper left, gentle green rim lighting, detailed dimensional 3D render, no outlines. No scenery, ground plane, lettering, captions, cell borders, watermarks or shadows outside the character. Actual alpha transparency, NOT a checkerboard. Target wide landscape sheet, 4 equal columns and 2 equal rows. This asset will replace a small flat cartoon sprite in a platform game.

## zombie-actions.png

Use case: stylized-concept. Asset type: transparent 2D game sprite atlas. Use the attached boy sprite sheet ONLY as the reference for dimensional animated-film rendering, lighting quality and the exact 4-column by 2-row layout. Generate a MATCHING enemy atlas: exactly 8 full-body poses of one comical zombie football player, evenly spaced in a 4-column by 2-row grid with equal cells. Same scale, same camera, same face and uniform in every cell, generous transparent padding. Every pose faces screen RIGHT so the game can flip sprites leftwards. Character: comically ugly, harmless cartoon zombie footballer with desaturated grey-green skin, oversized expressive head, messy dark hair, crooked eyebrows, big yellowish eyes, missing tooth, silly vacant expression. Non-graphic and family friendly. Royal-blue Rangers football jersey with white V collar and thin red trim, white shorts, black socks with red tops, dark blue boots; NO Celtic hoops. Polished rounded 3D film character, detailed soft shading, dimensional fabric, studio key light upper-left, subtle green rim light. Eight animation poses in reading order: 1 standing alert, 2 stepping forward left foot, 3 walking passing position, 4 stepping forward right foot, 5 crouched tackle windup, 6 low sliding tackle with one leg extended forwards and other knee bent, 7 startled recoil, 8 dazed seated with legs stretched forwards. Full head and boots must be visible inside each cell. Do not include footballs, ground shadows, scenery, text, grid lines, borders or watermarks. Actual transparent alpha background. No gore, no wounds. Wide landscape atlas, exactly FOUR equal columns and TWO equal rows.

## boy-actions.png

Use case: stylized-concept. Asset type: game action sprite atlas. References: use ONLY the green-and-white Celtic boy in the attached sprite sheet as the character identity and rendering reference. Ignore the blue zombie. Render that exact same fair-skinned cheerful blue-eyed boy, swept sandy brown quiff, green-white horizontal hooped short-sleeve jersey, white shorts, white socks with green bands, orange boots, polished dimensional animated-film rendering. Make one transparent atlas with exactly FOUR full-body poses in a TWO column by TWO row grid, equal cells, generous transparent padding, no overlap, all facing screen RIGHT in matching side/three-quarter view. Top left: running PASSING pose, one foot directly under hip and firmly pointing down, opposite knee lifted forward, arms alternate, torso upright. Top right: REVERSE RUN STRIDE, the near/right leg kicked BACK behind to the LEFT and the far/left leg reaching forward to the RIGHT, opposite arm swing, distinct from the reference's near leg extended forwards. Bottom left: JUMP, both knees bent and feet tucked back, arms spread for balance, joyful determined expression. Bottom right: SHOOT, planted left leg under hip, right leg extended forward horizontally to the right, arms balancing, torso leaning back slightly. Full head and boots visible in every cell. No football, no ground, no shadows on background, no scenery, no text or borders. Actual transparent alpha background. Same scale and consistent head size and face across all poses. TWO by TWO grid.

## Runtime integration

`src/characters.ts` extracts each cell's main connected silhouette, removes detached edge speckles, aligns the head and boots, and bakes logical 96×112 game textures. The jump and kick have dedicated poses; enemy walking, windup, slide, and knockout use their appropriate artwork. The fallen pose is baked horizontally. Source PNGs keep their alpha channels and remain unmodified.

## finale-poses.png

Created with built-in `image_gen`, using `boy-run.png` and `zombie-actions.png` as references and requesting genuine transparency.

Use case: stylized-concept. Asset type: transparent character sprite atlas for a behind-the-player football penalty minigame. Use the supplied green hooped boy and cartoon zombie sheets as exact identity, material, colour and animated-film style references. Make ONE atlas with exactly FOUR full-body characters in a strict TWO by TWO grid, equal cells and generous transparent margins, no overlap or captions. Top left: Celtic boy seen directly FROM BEHIND, standing with feet apart, arms at sides, facing away from the camera toward a goal. Show back of his sandy-brown quiff, green-and-white hooped short sleeve jersey with number 7 on the back, white shorts, white socks with green bands, orange boots. Top right: SAME boy from BEHIND, kicking forwards away from camera, left foot planted, right foot raised in follow-through, arms balancing. Bottom left: zombie GOALKEEPER facing the camera DIRECTLY FRONT ON, in ready crouch, hands with oversized cream goalkeeper gloves raised out to his sides. Same funny grey-green skin, dark messy hair, large yellow eyes, one missing tooth, silly menacing grin; purple long sleeve goalkeeper jersey, dark shorts, purple socks, dark boots. Bottom right: SAME zombie keeper diving sideways to his right, arms and gloves reaching fully to catch a ball, legs extended behind. Do not draw a ball, net, pitch, ground shadows or any scenery. Full bodies entirely visible and same head sizes across corresponding poses. Premium rounded 3D animated-film render, soft directional lighting, fine cloth and hair detail. Actual transparent alpha background. No grids, borders, text, logos or watermarks except boy jersey number 7.

## enemy-variants.png

Created with built-in `image_gen`, referencing `zombie-actions.png`, with genuine transparent alpha. The atlas is saved beside these prompts and consumed by `src/characters.ts`.

Use case: stylized-concept. Asset type: transparent character animation atlas for a 2D football runner. Match the attached sheet's premium rounded 3D animated-film rendering and blue Rangers-style football kits, but create TWO DISTINCT NEW zombie football players. STRICT grid of SIX equal columns by TWO equal rows, exactly 12 full-body sprites, generous clear transparent margins, no overlaps. Entire TOP ROW is one broad heavy bruiser: huge stocky shoulders, thick arms, bald pale-green head with one little dark tuft, square jaw, heavy brows, big belly, funny missing-tooth grin. Entire BOTTOM ROW is one tall lanky player: long skinny limbs, narrow blue-grey face, purple-black spiky mohawk, very long nose, yellow eyes, a distinctly different face and silhouette. Both wear royal-blue short-sleeve jerseys with white V collar and red sleeve trim, white shorts, black socks with red tops, blue football boots. ALL sprites face screen RIGHT in a consistent side/three-quarter view, same scale and head size WITHIN each row. Each row's SIX poses in left-to-right order: (1) healthy confident walking pose with near foot forwards; (2) healthy confident walking pose with opposite foot forwards; (3) visibly TIRED walking with slumped shoulders, head hanging, drooping eyelids, mouth open panting, a few sweat droplets, one foot forwards; (4) same visibly TIRED walk with opposite foot forwards; (5) low sliding tackle, one leg extended forwards and other knee bent; (6) knocked out lying flat horizontally on his BACK, eyes closed, head to left, boots to right, full body and boots inside cell. The tired poses must be conspicuously exhausted and hunched compared with healthy poses, but no injuries. These enemies take two hits and need to visibly look tired after the first hit. Funny, family-friendly cartoon monsters, NO blood, gore, wounds, weapons or realistic injuries. Clean studio key light from upper left, dimensional hair, skin and fabric, no outlines. Transparent alpha background only, no footballs, ground shadows, scenery, grid lines, captions, text or borders. Wide atlas with SIX columns and TWO rows.


## Level 02: Holytown Colts vs Yett Farm

### boy-holytown-run.png
A 4-column by 2-row sprite atlas showing 8 sequential running frames of the boy in the Holytown Colts kit (red and black vertical striped short-sleeve jersey with small gold circular chest crest, black shorts, black socks, and football boots), rendered in the matching 3D animated CGI feature film cartoon style.

### boy-holytown-actions.png
A 2-column by 2-row sprite atlas showing 4 action poses of the boy in the Holytown Colts kit: passing stride, reverse stride, airborne leap/jump, and powerful forward shooting kick.

### enemy-yettfarm-actions.png
A 4-column by 2-row sprite atlas of the Yett Farm midfielder opposition in royal blue jersey with bright yellow sleeves and trim, matching shorts and socks. 8 sequential poses: 4-frame walk cycle, tackle windup, sliding tackle, knockdown recoil, and dazed knockout.

### enemy-yettfarm-variants.png
A 6-column by 2-row atlas featuring the Yett Farm Bruiser (top row) and Tower (bottom row) in the royal blue and vibrant yellow opposition kit. 6 poses per row: 2 healthy walks, 2 tired/exhausted walks, sliding tackle, and horizontal knockout.

### finale-holytown-poses.png
A 2-column by 2-row sprite atlas for the Holytown penalty shootout:
- **Top row**: Holytown Colts boy from behind with white number 7 on back (ready stance and kick follow-through).
- **Bottom row**: Yett Farm goalkeeper in high-visibility neon-green jersey with padded cream gloves (ready front-on crouch and horizontal diving save).
