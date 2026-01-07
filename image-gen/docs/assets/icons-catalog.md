# Icons Catalog

The system includes 41 icons for icon-based badge generation. Icons are located in `assets/icons/`.

## Available Icons

### Achievement & Recognition

| Icon | Filename | Description |
|------|----------|-------------|
| Trophy | `trophy.png` | Award trophy |
| Medal | `medal.png` | Achievement medal |
| Crown | `crown.png` | Crown/royalty |
| Star | `star.png` | Star achievement |
| Diamond | `diamond.png` | Diamond/excellence |
| Gem | `gem.png` | Precious gem |
| Checkmark | `checkmark.png` | Completion/approval |
| Thumbs Up | `thumbs-up.png` | Approval/success |
| Goal | `goal.png` | Target/objective |
| Growth | `growth.png` | Progress/improvement |

### Science & Technology

| Icon | Filename | Description |
|------|----------|-------------|
| Atom | `atom.png` | Physics/chemistry |
| DNA | `dna.png` | Biology/genetics |
| Microscope | `microscope.png` | Research/lab work |
| Robot | `robot.png` | Robotics/automation |
| AI | `ai.png` | Artificial intelligence |
| Gear | `gear.png` | Engineering/mechanics |
| Energy | `energy.png` | Power/energy |
| Spaceship | `spaceship.png` | Space/exploration |
| Calculator | `calculator.png` | Mathematics |

### Programming & Technology

| Icon | Filename | Description |
|------|----------|-------------|
| Code | `code.png` | Programming |
| Brackets | `brackets.png` | Code/development |
| Binary Code | `binary-code.png` | Computer science |
| Cloud Service | `cloud-service.png` | Cloud computing |
| Globe | `globe.png` | Web/networking |

### Education & Learning

| Icon | Filename | Description |
|------|----------|-------------|
| Graduation Cap | `graduation-cap.png` | Education/graduation |
| Book | `book.png` | Learning/reading |
| Brain | `brain.png` | Intelligence/thinking |
| Presentation | `presentation.png` | Teaching/presenting |
| Solution | `solution.png` | Problem solving |

### Leadership & Collaboration

| Icon | Filename | Description |
|------|----------|-------------|
| Leadership | `leadership.png` | Leadership skills |
| Teamwork | `teamwork.png` | Collaboration |
| Handshake | `handshake.png` | Partnership/agreement |
| Shield | `shield.png` | Protection/security |

### Arts & Creativity

| Icon | Filename | Description |
|------|----------|-------------|
| Art | `art.png` | Visual arts |
| Color Palette | `color-palette.png` | Design/creativity |
| Music Note | `music_note.png` | Music |
| Ink Bottle | `ink-bottle.png` | Writing/calligraphy |

### Communication & Skills

| Icon | Filename | Description |
|------|----------|-------------|
| Speech Bubble | `speech_bubble.png` | Communication |
| Emotions | `emotions.png` | Emotional intelligence |
| Clock | `clock.png` | Time management |
| Dumbbell | `dumbbell.png` | Fitness/strength |

## Usage

### In Layer Configuration

```json
{
  "type": "ImageLayer",
  "path": "assets/icons/atom.png",
  "size": {"dynamic": true},
  "position": {"x": "center", "y": "center"},
  "z": 20
}
```

### With Icon Matching API

The API automatically selects icons based on badge description:

```json
{
  "image_type": "icon_based",
  "badge_name": "Chemistry Excellence",
  "badge_description": "Mastered chemical reactions and lab techniques",
  "image_configuration": {"shape": "hexagon"}
}
```

This might match `atom.png`, `microscope.png`, or `dna.png` based on the description.

## Icon Matching Algorithm

The system uses AI (sentence-transformers) to match badge descriptions to icons:

1. Badge name and description are combined
2. Text is embedded using `all-MiniLM-L6-v2` model
3. Similarity is calculated against icon catalog
4. Top matching icon is selected

### Matching Examples

| Description | Likely Match |
|-------------|--------------|
| "Completed programming course" | `code.png`, `brackets.png` |
| "Science fair winner" | `atom.png`, `microscope.png` |
| "Leadership training" | `leadership.png`, `crown.png` |
| "Teamwork excellence" | `teamwork.png`, `handshake.png` |
| "Creative arts achievement" | `art.png`, `color-palette.png` |

## Adding New Icons

1. Add PNG file to `assets/icons/`
2. Update icon catalog metadata (if using icon_matcher)
3. Icons should be:
   - PNG format with transparency
   - Square aspect ratio recommended
   - Minimum 256x256 pixels

## Icon Categories Summary

| Category | Count | Icons |
|----------|-------|-------|
| Achievement | 10 | trophy, medal, crown, star, diamond, gem, checkmark, thumbs-up, goal, growth |
| Science | 9 | atom, dna, microscope, robot, ai, gear, energy, spaceship, calculator |
| Programming | 5 | code, brackets, binary-code, cloud-service, globe |
| Education | 5 | graduation-cap, book, brain, presentation, solution |
| Leadership | 4 | leadership, teamwork, handshake, shield |
| Arts | 4 | art, color-palette, music_note, ink-bottle |
| Skills | 4 | speech_bubble, emotions, clock, dumbbell |
| **Total** | **41** | |
