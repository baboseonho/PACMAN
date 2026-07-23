"use strict";

const COURSE_MISSIONS = [
  {
    id: "problem", phase: "01 · PROBLEM", nav: "Behavior problem", title: "Why does a monster need AI?",
    lead: "A monster that only follows the player is predictable. A useful game agent must observe the situation, choose a behavior, and then act.",
    icon: "?", conceptTitle: "One character, several behaviors",
    conceptText: "The same monster can patrol when the player is far away, chase when the player is close, and attack only at very short range.", lab: "fsm",
    codeReference: [
      ["behaviors", "A variable that will store the available state names."],
      ["[ ... ]", "A Python list: an ordered collection of values."],
      ["\"PATROL\"", "A string value. Quotation marks make it text, not a variable name."]
    ],
    time: 3,
    task: {
      taskTitle: "Declare the available behaviors", type: "code", validator: "behaviorList",
      prompt: "Create a Python list named `behaviors` containing PATROL, CHASE, and ATTACK in that order.",
      starter: "behaviors = [\n    # type the three states\n]\n",
      hints: ["The lecture divides behavior into three named states.", "Use a Python list of strings.", "Type PATROL, CHASE, and ATTACK in that order."]
    }
  },
  {
    id: "fsm", phase: "02 · FSM", nav: "Finite State Machine", title: "Model behavior with an FSM",
    lead: "A Finite State Machine divides behavior into a finite set of states and changes the current state when a transition condition becomes true.",
    icon: "S", conceptTitle: "State → condition → transition → behavior",
    conceptText: "The state stores what the monster is doing now. Conditions decide whether that state should change. Each state owns its behavior.", lab: "fsm",
    codeReference: [
      ["monster.state", "The monster's current state value."],
      ["monster.patrol()", "Runs the behavior for roaming around the map."],
      ["monster.chase_player()", "Runs the behavior for following the player."],
      ["monster.attack()", "Runs the close-range attack behavior."]
    ],
    time: 4,
    task: {
      taskTitle: "Dispatch behavior from state", type: "code", validator: "fsmDispatch",
      prompt: "Write an `if / elif / elif` block that calls `patrol()`, `chase_player()`, or `attack()` from `monster.state`.",
      starter: "# Dispatch one behavior from monster.state\n",
      hints: ["Compare `monster.state` with each state string.", "Call one method inside each branch.", "PATROL→patrol(), CHASE→chase_player(), ATTACK→attack()."]
    }
  },
  {
    id: "conditions", phase: "03 · TRANSITIONS", nav: "Condition order", title: "Check the specific condition first",
    lead: "If `distance < 200` is checked before `distance < 50`, a distance of 30 becomes CHASE and the ATTACK branch is never reached.",
    icon: "<", conceptTitle: "Overlapping conditions need careful order",
    conceptText: "Because every value below 50 is also below 200, test the smaller and more specific attack range before the larger chase range.", lab: "fsm",
    codeReference: [
      ["if / elif / else", "Python checks branches from top to bottom and runs the first matching branch."],
      ["distance", "A number representing how far the monster is from the player."],
      ["<", "A strict less-than comparison; the boundary value itself is not included."],
      ["monster.state = ...", "Assignment: replaces the monster's current state."]
    ],
    time: 4,
    task: {
      taskTitle: "Write a correct transition function", type: "code", validator: "conditionOrder",
      prompt: "Complete Python logic that sets ATTACK below 50, CHASE below 200, and PATROL otherwise. Use `distance` and `monster.state`.",
      starter: "# Write the three branches here\n",
      hints: ["The two ranges overlap, so start with the smaller one.", "Use `if`, `elif`, and `else`.", "First `< 50` → ATTACK; second `< 200` → CHASE; else → PATROL."]
    }
  },
  {
    id: "matrix", phase: "04 · MATRIX", nav: "Build a matrix map", title: "Write your own N × N game map",
    lead: "Before pathfinding can run, the game world needs data. Build a 15 × 15 or larger square matrix whose walls, paths, Pac-Man, and two ghosts become a playable board.",
    icon: "▦", conceptTitle: "Rows and columns become map coordinates",
    conceptText: "Use 0 for a pellet path, 1 for a wall, and the Python strings \"P\", \"G1\", and \"G2\" for the three character starts. The renderer adds a one-tile wall border. Each ghost must begin at least 8 Manhattan tiles from Pac-Man.", lab: "matrix",
    codeReference: [
      ["map_data", "The variable that stores the entire two-dimensional map."],
      ["map_data[row][column]", "Reads one tile using its row first and column second."],
      ["0 / 1", "0 creates a walkable pellet path; 1 creates a wall."],
      ["\"P\" / \"G1\" / \"G2\"", "Quoted start markers for Pac-Man and the two ghosts. Use each exactly once."],
      ["Run map", "Checks the matrix and saves a valid map to Play Lab as Student map."]
    ],
    time: 6,
    task: {
      taskTitle: "Build and run a playable N × N matrix", type: "code", validator: "matrixMap",
      prompt: "Write a 15 × 15 to 25 × 25 square matrix. Use 0 for pellet paths, 1 for walls, and exactly one each of the strings \"P\", \"G1\", and \"G2\". Keep both ghosts at least 8 Manhattan tiles from \"P\" and connect every walkable tile, then press `Run map`.",
      starter: "map_data = [\n    # 0 path, 1 wall, \"P\" Pac-Man, \"G1\" / \"G2\" ghosts\n]\n",
      hints: ["Use 15 to 25 rows and the same number of columns.", "Character markers are Python strings, so keep the quotes: \"P\", \"G1\", and \"G2\".", "Place each marker exactly once, keep each ghost 8 or more row-and-column steps from P, and connect every non-wall tile." ]
    }
  },
  {
    id: "distance", phase: "05 · DISTANCE", nav: "get_distance()", title: "Measure distance on the grid",
    lead: "The matrix gives Pac-Man and the ghost a row and column. The FSM needs one number that tells it how far apart those positions are.",
    icon: "|·|", conceptTitle: "Manhattan distance follows rows and columns",
    conceptText: "For positions (r1, c1) and (r2, c2), add the absolute row difference and absolute column difference: abs(r1 - r2) + abs(c1 - c2).", lab: "matrix",
    codeReference: [
      ["def get_distance(pos_a, pos_b):", "Defines a reusable function with two position inputs."],
      ["pos_a[0] / pos_a[1]", "Index 0 is the row; index 1 is the column."],
      ["abs(value)", "Returns the non-negative absolute value of a number."],
      ["return", "Sends the calculated distance back to the caller."]
    ],
    time: 4,
    task: {
      taskTitle: "Define get_distance()", type: "code", validator: "getDistance",
      prompt: "Define `get_distance(pos_a, pos_b)` and return their Manhattan distance using index 0 for rows, index 1 for columns, and `abs()` for both differences.",
      starter: "def get_distance(pos_a, pos_b):\n",
      hints: ["A position tuple stores `(row, column)`.", "Use `abs()` once for the row difference and once for the column difference.", "Return `abs(pos_a[0] - pos_b[0]) + abs(pos_a[1] - pos_b[1])`." ]
    }
  },
  {
    id: "grid", phase: "06 · GRID", nav: "Map representation", title: "Turn the game map into a graph",
    lead: "A maze can be represented as a 2D grid. Every walkable tile is a node; legal up, down, left, and right moves become graph edges.",
    icon: "#", conceptTitle: "Four-direction grid graph",
    conceptText: "Walls are blocked nodes. Diagonal movement is not allowed in this lecture, so each floor tile has at most four neighbors.", lab: "path",
    codeReference: [
      ["directions", "Four (row change, column change) pairs for up, down, left, and right."],
      ["for dr, dc in directions", "Repeats the block once for each possible direction."],
      ["0 <= nr < rows", "A chained comparison that keeps the new row inside the map."],
      ["neighbors.append((nr, nc))", "Adds one legal neighboring position to the list."]
    ],
    time: 3,
    task: {
      taskTitle: "Write the neighbor filter", type: "code", validator: "neighbors",
      prompt: "Write Python code that loops over four directions. Keep the Python comparisons exactly as `0 <= nr < rows`, `0 <= nc < cols`, and `map_data[nr][nc] != WALL`, then append `(nr, nc)`.",
      starter: "directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]\nneighbors = []\n",
      hints: ["Calculate `nr = r + dr` and `nc = c + dc`.", "Check row bounds, column bounds, and `map_data[nr][nc] != WALL`.", "Append `(nr, nc)` only inside the combined condition."]
    }
  },
  {
    id: "cost", phase: "07 · COST MAP", nav: "Movement cost", title: "The fastest route is not always the shortest",
    lead: "A normal tile takes 1 tick to cross, but a sticky SLIME tile takes 2. Cost is the time a tile steals from the ghost — fewer steps can still mean a slower arrival.",
    icon: "+", conceptTitle: "Cost = time to cross a tile",
    conceptText: "Navigation apps work the same way: a short road full of traffic loses to a longer, faster road. Dijkstra minimizes total cost, so slime on the shortcut can make a longer detour the fastest route.", lab: "path",
    codeReference: [
      ["get_tile_cost(tile)", "A function that converts a tile type into its movement cost."],
      ["WALL / SLIME", "Named constants for two special tile types."],
      ["cost 2", "The ghost needs two ticks to cross sticky slime, so it enters at half speed."],
      ["None", "Means the wall cannot be entered, rather than giving it a numeric cost."],
      ["return", "Stops the function and sends one result back."]
    ],
    time: 3,
    task: {
      taskTitle: "Implement a tile-cost function", type: "code", validator: "tileCostFunction",
      prompt: "Write `get_tile_cost(tile)` so WALL returns `None`, SLIME returns 2, and every other floor tile returns 1.",
      starter: "def get_tile_cost(tile):\n",
      success: "Correct. `None` blocks WALL completely, cost 2 makes sticky SLIME twice as slow to cross, and cost 1 keeps normal floor cheapest. Dijkstra adds these ticks to find the fastest arrival — in the Play lab, ghosts now detour around slime.",
      hints: ["Check WALL before returning a numeric cost.", "SLIME returns 2 because crossing it takes 2 ticks instead of 1.", "Return None for WALL, 2 for SLIME, and 1 otherwise."]
    }
  },
  {
    id: "dijkstra", phase: "08 · DIJKSTRA", nav: "Lowest-cost search", title: "Expand the cheapest known position",
    lead: "Dijkstra repeatedly chooses the cheapest candidate, checks its neighboring tiles, and keeps a new route only when its total cost is lower.",
    icon: "D", conceptTitle: "Frontier, visited set, and relaxation",
    conceptText: "Think of frontier as a to-do list. The algorithm opens the cheapest item first, calculates the cost of reaching each neighbor, and replaces an old record only with a strictly cheaper one.", lab: "path",
    codeReference: [
      ["min(frontier, key=...)", "Selects the frontier item whose key value is the smallest."],
      ["lambda node: distance[node]", "A short function telling min() which cost to compare."],
      ["distance[node]", "The cheapest total cost currently known for reaching node."],
      ["cost[next_node]", "The extra movement cost paid to enter the neighboring tile."],
      ["relaxation", "Updates a record only when the newly calculated route is cheaper."]
    ],
    guide: {
      title: "Read the search variables before coding",
      intro: "The names below are not separate Python functions. They are the pieces of information Dijkstra uses while searching the map.",
      terms: [
        ["frontier", "Candidate tiles waiting to be checked."],
        ["distance[node]", "The lowest total cost currently known from the ghost to node."],
        ["current", "The cheapest candidate selected from frontier for this step."],
        ["next_node", "One neighboring tile of current that is being tested."],
        ["cost[next_node]", "The movement cost paid when entering next_node."],
        ["relaxation", "Replacing an old distance record when a cheaper route is found."]
      ],
      exampleTitle: "Worked example: should the record be replaced?",
      exampleText: "Suppose current costs 3 to reach, entering next_node costs 2, and the old record for next_node is 8.",
      exampleCode: "new_cost = 3 + 2       # 5\n5 < 8                  # True\ndistance[next_node] = 5",
      exampleResult: "Because 5 is lower than 8, the old record is replaced. If new_cost were 8 or 9, the record would stay unchanged.",
      steps: [
        "Select the WEIGHTED map in Path Lab.",
        "Turn on Edit cost and change three different floor tiles.",
        "Press Run and wait until the final green path appears.",
        "Write the three rules: select current, calculate new_cost, then update only when new_cost is smaller."
      ]
    },
    time: 5,
    task: {
      taskTitle: "Code the priority and relaxation rules", type: "code", validator: "relaxation", requiresLab: true, requiresEdits: 3,
      prompt: "Complete the four lab steps above. Then write Python that (1) selects the frontier node with the lowest distance, (2) adds the next tile cost, and (3) saves the result only when it is strictly lower than the old record.",
      starter: "# frontier is a collection of candidate nodes\n",
      success: "Correct. Dijkstra selects the lowest-distance candidate, adds the cost of entering its neighbor, and relaxes that neighbor only when the new total is strictly lower.",
      hints: ["Edit three different costs before running the algorithm.", "Use `min(frontier, key=lambda node: distance[node])`.", "Calculate, compare, and update `distance[next_node]`."]
    }
  },
  {
    id: "path-api", phase: "09 · PATH API", nav: "find_path() result", title: "A path is an ordered list of positions",
    lead: "`find_path(map_data, ghost_pos, pacman_pos)` hides the search behind a simple API and returns positions from the ghost to Pac-Man.",
    icon: "[]", conceptTitle: "Read the returned list correctly",
    conceptText: "`path[0]` is the current ghost position, `path[1]` is the next tile, and `path[-1]` is Pac-Man's position.", lab: "path",
    codeReference: [
      ["find_path(map_data, start, goal)", "Returns an ordered list of positions from start to goal."],
      ["path[0]", "The first list item: the ghost's current tile."],
      ["path[1]", "The second item: the single next tile to move to."],
      ["path[-1]", "The last item: the destination tile."],
      ["len(path)", "Counts how many positions the returned path contains."]
    ],
    time: 4,
    task: {
      taskTitle: "Move exactly one tile", type: "code", validator: "moveOne",
      prompt: "Call `find_path(map_data, ghost_pos, pacman_pos)`, check that the next tile exists, and update the ghost by one tile only.",
      starter: "path = find_path(map_data, ghost_pos, pacman_pos)\n",
      hints: ["The next tile exists only when `len(path) > 1`.", "Do not jump to `path[-1]`.", "Inside the safety check, set `ghost_pos = path[1]`."]
    }
  },
  {
    id: "recalculate", phase: "10 · UPDATE LOOP", nav: "Recalculate safely", title: "Recalculate after every move",
    lead: "After one move, the old `path[1]` becomes the new `path[0]`. If Pac-Man moves, the old path may already be wrong, so the path must be recalculated.",
    icon: "↻", conceptTitle: "Search, validate, move one step, repeat",
    conceptText: "Never access `path[1]` before confirming `len(path) > 1`. An empty or one-element path means there is no valid next tile.", lab: "path",
    codeReference: [
      ["update_ghost(...)", "A function called again for each ghost movement update."],
      ["find_path(...)", "Recalculates a path using the latest positions."],
      ["len(path) > 1", "Confirms that a next tile exists before reading path[1]."],
      ["return path[1]", "Returns one next step, not the whole route or destination."],
      ["return ghost_pos", "Safe fallback when no next step is available."]
    ],
    time: 4,
    task: {
      taskTitle: "Write the update function", type: "code", validator: "updateGhost",
      prompt: "Define `update_ghost()` so it recalculates the path every call, checks its length, and returns the next position or the current position when no next tile exists.",
      starter: "def update_ghost(map_data, ghost_pos, pacman_pos):\n",
      hints: ["Call `find_path` inside the function.", "Return `path[1]` only when `len(path) > 1`.", "Otherwise return `ghost_pos`."]
    }
  },
  {
    id: "integration", phase: "11 · INTEGRATION", nav: "FSM + Dijkstra", title: "Combine decision and pathfinding",
    lead: "FSM answers when to chase. Dijkstra answers which path to take. A smart monster runs pathfinding only while its state is CHASE — and you already wrote that pathfinding step as `update_ghost()` in Mission 10.",
    icon: "AI", conceptTitle: "Decision layer + navigation layer (reuse!)",
    conceptText: "First update the state from distance. Then, only in CHASE, reuse `update_ghost()` from Mission 10 — it already recalculates the path, checks the length, and returns the next tile. Calling tested functions instead of retyping their code is how real game code is built.", lab: "path",
    codeReference: [
      ["get_distance(...)", "Calculates the value used by the FSM transition conditions."],
      ["ghost.state", "Stores the decision made by the FSM."],
      ["update_ghost(map_data, ghost_pos, pacman_pos)", "Your Mission 10 function: recalculates the path and returns the next tile, or the current position when no route exists."],
      ["ghost_pos = update_ghost(...)", "Moves the ghost exactly one tile by reusing the function instead of retyping find_path and the length check."]
    ],
    time: 5,
    task: {
      taskTitle: "Implement the complete smart-monster update", type: "code", validator: "integration",
      prompt: "Write one update block that selects ATTACK below 50, CHASE below 200, PATROL otherwise, and — only in CHASE — moves the ghost by calling `update_ghost(map_data, ghost_pos, pacman_pos)`.",
      starter: "distance = get_distance(ghost_pos, pacman_pos)\n",
      success: "Correct. FSM decides when to hunt, and your own Mission 10 function decides where to step — decision layer plus navigation layer, connected by reuse. Your smart monster is complete!",
      hints: ["Finish the FSM before the CHASE movement block.", "The specific `< 50` condition must appear before `< 200`.", "In CHASE: `ghost_pos = update_ghost(map_data, ghost_pos, pacman_pos)` — the function already handles find_path and the length check."]
    }
  },
  {
    id: "playground", phase: "12 · PLAYGROUND", nav: "Bonus: more mazes", title: "Bonus: design levels beyond your Student map",
    lead: "Your Mission 4 matrix is already playable as the Student map in the Play lab. When you want to try more level ideas, this Build lab lets you design brand-new mazes — now with slime — and play them instantly.",
    icon: "★", conceptTitle: "Level design is an AI experiment",
    conceptText: "Every wall you paint changes the graph, and every slime tile changes the cost map. Watch where your ghosts detour — that is Dijkstra reacting to the world you drew.",
    lab: "build",
    time: 6,
    task: {
      taskTitle: "Bonus: build it, place it, play it", type: "build", validator: "playground",
      prompt: "Bonus mission — your smart AI is already complete. In the Build lab: pick a size, paint at least 12 wall tiles and 3 slime tiles, place P, G1, and G2 on open tiles, then press Play this map and start your own maze.",
      success: "Level confirmed. Your FSM decides when the ghosts hunt, and Dijkstra finds the fastest route through the exact walls and slime you painted.",
      hints: [
        "Drag across the grid to paint many wall tiles in one stroke.",
        "Slime is strongest in narrow corridors: a slimed shortcut makes smart ghosts take the long way around.",
        "Keep both ghosts at least 6 tiles away from Pac-Man, then press Play this map and START GAME."
      ]
    }
  }
];

const PATH_MAPS = [
  {
    id: "equal", name: "EQUAL",
    description: "Every floor tile costs 1.",
    map: [
      "###########",
      "#S11#1111G#",
      "#1#1#1###1#",
      "#1#1111#11#",
      "#1#####1#1#",
      "#111111111#",
      "###########"
    ]
  },
  {
    id: "weighted", name: "WEIGHTED",
    description: "The short route crosses deep slime (cost 9).",
    map: [
      "###########",
      "#S1999911G#",
      "#1#####1#1#",
      "#1111111#1#",
      "#1#####1#1#",
      "#111111111#",
      "###########"
    ]
  },
  {
    id: "walls", name: "WALL MAZE",
    description: "Walls force a four-direction detour.",
    map: [
      "###########",
      "#S111#111G#",
      "###1#1###1#",
      "#111#11111#",
      "#1#####1###",
      "#111111111#",
      "###########"
    ]
  }
];
