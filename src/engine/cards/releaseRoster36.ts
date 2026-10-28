import { CardDefinition, PieceAnchor, CardVisualTheme } from '../../types/deckChess';

export const PIECE_COLOR_THEMES: Record<PieceAnchor, CardVisualTheme> = {
  pawn: {
    color: 'pawn-gray',
    hex: '#8A9199',
    badgeIcon: '♟'
  },
  knight: {
    color: 'knight-green',
    hex: '#3FB950',
    badgeIcon: '♞'
  },
  bishop: {
    color: 'bishop-blue',
    hex: '#3B82F6',
    badgeIcon: '♝'
  },
  rook: {
    color: 'rook-purple',
    hex: '#A855F7',
    badgeIcon: '♜'
  },
  queen: {
    color: 'queen-red',
    hex: '#EF4444',
    badgeIcon: '♛'
  },
  king: {
    color: 'king-gold',
    hex: '#D4AF37',
    badgeIcon: '♚'
  }
};

export const CANONICAL_36_CARDS: CardDefinition[] = [
  // --- WORLD 1: THE CAUSEWAY ---
  {
    id: 'p1_sidestep',
    code: 'P1',
    name: 'Sidestep',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p1_sidestep',
    conditionText: 'Pawn has any piece directly in front.',
    effectText: 'Step 1 square diagonally forward onto an empty square.',
    description: 'Pawn blocked frontally: Step 1 square diagonally forward onto an empty square.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'p2_head_on',
    code: 'P2',
    name: 'Attack Head On',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p2_head_on',
    conditionText: 'Pawn has enemy Pawn directly in front.',
    effectText: 'Capture enemy Pawn straight ahead.',
    description: 'Enemy Pawn directly ahead: Capture that Pawn straight forward.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'p3_follow_me',
    code: 'P3',
    name: 'March Together',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p3_follow_me',
    conditionText: 'Two friendly Pawns are horizontally adjacent with empty squares directly in front.',
    effectText: 'Advance both friendly Pawns 1 square straight forward together.',
    description: 'Adjacent ally Pawns with open fronts: Advance both Pawns 1 square forward together.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'n1_adrenaline_jump',
    code: 'N1',
    name: 'Adrenaline Jump',
    anchor: 'knight',
    world: 1,
    energyCost: 0,
    artId: 'n1_adrenaline_jump',
    conditionText: 'Knight is under attack.',
    effectText: 'Jump 3 squares in one direction and 1 square perpendicular. (3x1 jump)',
    description: 'Knight under attack: Leap 3 squares orthogonal and 1 perpendicular (3x1 jump).',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'b1_let_me_through',
    code: 'B1',
    name: 'Let Me Through',
    anchor: 'bishop',
    world: 1,
    energyCost: 0,
    artId: 'b1_let_me_through',
    conditionText: 'Friendly Pawn sits on this Bishop\'s unobstructed forward diagonal.',
    effectText: 'Slide cleanly through that friendly Pawn to any unobstructed square beyond.',
    description: 'Friendly Pawn on forward diagonal: Phase cleanly through Pawn to square beyond.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'n2_swap_with_me',
    code: 'N2',
    name: 'Springboard',
    anchor: 'knight',
    world: 1,
    energyCost: 0,
    artId: 'n2_swap_with_me',
    conditionText: 'Friendly piece occupies one of this Knight\'s L-jump squares.',
    effectText: 'Bounce off friendly piece to make a second full L-jump (move or capture).',
    description: 'Ally on L-jump landing: Bounce off ally square to make a second full L-jump.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'r1_make_way',
    code: 'R1',
    name: 'Make Way',
    anchor: 'rook',
    world: 1,
    energyCost: 0,
    artId: 'r1_make_way',
    conditionText: 'Friendly Pawn is orthogonally adjacent and has an empty square perpendicular to your line.',
    effectText: 'Pawn steps aside perpendicular to an empty square, and Rook slides to any open square along the opened line.',
    description: 'Adjacent ally Pawn steps aside to empty square, clearing file for Rook to charge.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },

  // --- WORLD 2: THE OUTER COURTYARD ---
  {
    id: 'n3_trample',
    code: 'N3',
    name: 'Trample',
    anchor: 'knight',
    world: 2,
    energyCost: 0,
    artId: 'n3_trample',
    conditionText: 'Enemy Pawn lies on the 2-square straight leg of either L-jump path.',
    effectText: 'Jump to landing square (move or capture) and destroy enemy Pawns on that leg.',
    description: 'Enemy Pawn on straight leg of L-jump: Leap to landing and trample that Pawn.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'r2_ive_got_your_back',
    code: 'R2',
    name: "I've Got Your Back",
    anchor: 'rook',
    world: 2,
    energyCost: 0,
    artId: 'r2_ive_got_your_back',
    conditionText: 'Friendly non-King piece sits on same rank with square in front open or enemy.',
    effectText: 'Push friendly piece 1 square forward (move or capture) and slide Rook into vacated tile.',
    description: 'Ally on same rank: Push ally 1 square forward to move or capture, taking its vacated tile.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },
  {
    id: 'b2_pierce',
    code: 'B2',
    name: 'Pierce',
    anchor: 'bishop',
    world: 2,
    energyCost: 0,
    artId: 'b2_pierce',
    conditionText: 'Exactly 1 enemy Pawn sits on unobstructed diagonal with squares beyond.',
    effectText: 'Destroy enemy Pawn, landing on empty square or capturing enemy beyond.',
    description: 'Enemy Pawn on diagonal: Destroy Pawn and land on empty tile or capture enemy beyond.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'r3_cut_across',
    code: 'R3',
    name: 'Cut Across',
    anchor: 'rook',
    world: 2,
    energyCost: 0,
    artId: 'r3_cut_across',
    conditionText: 'Rook sits on one of two 8-square main diagonals (a1-h8 or a8-h1).',
    effectText: 'Step 1 square diagonally along main diagonal (empty or capture).',
    description: 'Rook on main diagonal: Step 1 square diagonally along that diagonal to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },

  // --- WORLD 3: THE BARRACKS ---
  {
    id: 'p4_attack_together',
    code: 'P4',
    name: 'Attack Together',
    anchor: 'pawn',
    world: 3,
    energyCost: 0,
    artId: 'p4_attack_together',
    conditionText: 'Pawn can capture an enemy piece diagonally ahead and has an adjacent friendly Pawn.',
    effectText: 'Capture the enemy piece and move that adjacent friendly Pawn into vacated origin square.',
    description: 'Adjacent ally Pawn: Capture diagonally and step adjacent Pawn into origin square.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'n4_pin_swap',
    code: 'N4',
    name: 'Square Jump',
    anchor: 'knight',
    world: 3,
    energyCost: 0,
    artId: 'n4_pin_swap',
    conditionText: 'Knight is defended by any friendly piece.',
    effectText: 'Jump 2 squares diagonally in any direction to move or capture.',
    description: 'Defended Knight: Jump 2 squares diagonally in any direction to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'b3_ricochet',
    code: 'B3',
    name: 'Ricochet',
    anchor: 'bishop',
    world: 3,
    energyCost: 0,
    artId: 'b3_ricochet',
    conditionText: 'Empty square on a-file or h-file lies along unobstructed diagonal.',
    effectText: 'Slide diagonally to edge and bounce 90 degrees inward along reflected diagonal (move or capture).',
    description: 'Unobstructed diagonal to edge: Slide to rim and bounce 90 degrees inward to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'n6_flanking_support',
    code: 'N6',
    name: 'Flanking Support',
    anchor: 'knight',
    world: 3,
    energyCost: 0,
    artId: 'n6_flanking_support',
    conditionText: 'Knight is on file a, b, g, or h and you have another friendly Knight.',
    effectText: 'Make normal Knight jump, and move other friendly Knight into vacated square.',
    description: 'Flank Knight with second Knight: Jump outer Knight and teleport second Knight to origin.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'k2_royal_knighting',
    code: 'K2',
    name: 'Royal Knighting',
    anchor: 'king',
    world: 3,
    energyCost: 0,
    artId: 'k2_royal_knighting',
    conditionText: 'Friendly Pawn is horizontally adjacent (1 square left or right on same rank) to King.',
    effectText: 'Remove friendly Pawn to graveyard and spawn a friendly Knight onto that exact square.',
    description: 'Pawn horizontally adjacent to King: Knight adjacent Pawn, transforming it into a Knight.',
    visualTheme: PIECE_COLOR_THEMES.king
  },

  // --- WORLD 4: THE CHAPEL ---
  {
    id: 'p5_get_behind_me',
    code: 'P5',
    name: 'Get Behind Me',
    anchor: 'pawn',
    world: 4,
    energyCost: 0,
    artId: 'p5_get_behind_me',
    conditionText: 'Friendly non-Pawn, non-King piece in the 3 forward squares is under attack.',
    effectText: 'Swap places with that attacked friendly piece.',
    description: 'Ally ahead under attack: Heroically swap places with that attacked piece.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'b4_change_color',
    code: 'B4',
    name: 'Change Color',
    anchor: 'bishop',
    world: 4,
    energyCost: 0,
    artId: 'b4_change_color',
    conditionText: 'At least 1 enemy piece is orthogonally adjacent to this Bishop.',
    effectText: 'Step 1 square orthogonally onto empty square or capture adjacent enemy.',
    description: 'Orthogonally adjacent enemy: Step 1 square orthogonally to move, capture, and switch color.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'n5_get_to_the_king',
    code: 'N5',
    name: 'Get to the King',
    anchor: 'knight',
    world: 4,
    energyCost: 0,
    artId: 'n5_get_to_the_king',
    conditionText: 'Knight can jump to an unthreatened square that forks enemy King and another enemy piece.',
    effectText: 'Jump to safe forking square, then make an immediate second L-jump.',
    description: 'Jump to safe forking square attacking King and enemy piece, then make a second L-jump.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'b5_take_my_place',
    code: 'B5',
    name: 'Take My Place',
    anchor: 'bishop',
    world: 4,
    energyCost: 0,
    artId: 'b5_take_my_place',
    conditionText: 'This Bishop is under attack by any enemy piece.',
    effectText: 'Swap places with friendly non-King piece along unobstructed diagonal.',
    description: 'Bishop under attack: Swap places with friendly piece along unobstructed diagonal.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'b6_come_this_way',
    code: 'B6',
    name: 'Diagonal Launch',
    anchor: 'bishop',
    world: 4,
    energyCost: 0,
    artId: 'b6_come_this_way',
    conditionText: 'Friendly Pawn sits in the rank directly ahead of this Bishop.',
    effectText: 'Launch friendly Pawn along its forward diagonals to move or capture.',
    description: 'Pawn in rank ahead of Bishop: Launch Pawn diagonally forward to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },

  // --- WORLD 5: THE ARMORY ---
  {
    id: 'p6_tag_out',
    code: 'P6',
    name: 'Double Time',
    anchor: 'pawn',
    world: 5,
    energyCost: 0,
    artId: 'p6_tag_out',
    conditionText: 'Pawn is on Ranks 3, 4, or 5 with 2 empty squares directly in front.',
    effectText: 'Advance this Pawn 2 squares straight forward.',
    description: 'Pawn on Ranks 3-5 with open path: Sprint 2 squares straight forward.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'r4_move_in_unison',
    code: 'R4',
    name: 'Move in Unison',
    anchor: 'rook',
    world: 5,
    energyCost: 0,
    artId: 'r4_move_in_unison',
    conditionText: 'Two friendly Rooks share unobstructed rank or file.',
    effectText: 'Move this Rook along line, and move second Rook into square this Rook vacated.',
    description: 'Connected Rooks: Move this Rook along line, pulling second Rook into vacated square.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },
  {
    id: 'q1_royal_summons',
    code: 'Q1',
    name: 'Royal Summons',
    anchor: 'queen',
    world: 5,
    energyCost: 0,
    artId: 'q1_royal_summons',
    conditionText: 'Friendly non-King piece lies in Queen line of sight at distance >= 2.',
    effectText: 'Pull friendly piece along ray onto empty square adjacent to Queen.',
    description: 'Ally in line of sight: Summon ally along ray onto empty square adjacent to Queen.',
    visualTheme: PIECE_COLOR_THEMES.queen
  },
  {
    id: 'r5_catapult',
    code: 'R5',
    name: 'Catapult',
    anchor: 'rook',
    world: 5,
    energyCost: 0,
    artId: 'r5_catapult',
    conditionText: 'Friendly piece is directly in front of Rook and enemy lies along ray beyond.',
    effectText: 'Launch front ally over open ray to capture enemy ahead (Rook stays in place).' ,
    description: 'Ally in front and enemy ahead: Launch ally along open ray to capture enemy target.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },
  {
    id: 'k1_conscription',
    code: 'K1',
    name: 'Conscription',
    anchor: 'king',
    world: 5,
    energyCost: 0,
    artId: 'k1_conscription',
    conditionText: 'King is on home back rank (Rank 1/8) with empty adjacent orthogonal square.',
    effectText: 'Spawn friendly Pawn onto each empty adjacent orthogonal square (up to 3 Pawns).',
    description: 'King on home back rank: Conscript friendly Pawns onto empty orthogonal squares.',
    visualTheme: PIECE_COLOR_THEMES.king
  },

  // --- WORLD 6: THE ROYAL COURT ---
  {
    id: 'p7_protect_the_king',
    code: 'P7',
    name: 'Protect the King',
    anchor: 'pawn',
    world: 6,
    energyCost: 0,
    artId: 'p7_protect_the_king',
    conditionText: 'Friendly King is in this Pawn\'s 8 surrounding squares.',
    effectText: 'Slide this Pawn diagonally any unobstructed distance to move or capture.',
    description: 'Adjacent to friendly King: Slide Pawn diagonally any distance to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'q2_the_queens_gambit',
    code: 'Q2',
    name: "The Queen's Gambit",
    anchor: 'queen',
    world: 6,
    energyCost: 0,
    artId: 'q2_the_queens_gambit',
    conditionText: 'Friendly non-King unit in Queen line of sight is under attack by enemy non-King unit.',
    effectText: 'Sacrifice friendly unit to graveyard and move Queen onto attacking enemy unit square.',
    description: 'Ally attacked in Queen sight: Sacrifice ally and snap Queen to capture attacking enemy.',
    visualTheme: PIECE_COLOR_THEMES.queen
  },
  {
    id: 'r6_garrison',
    code: 'R6',
    name: 'Garrison',
    anchor: 'rook',
    world: 6,
    energyCost: 0,
    artId: 'r6_garrison',
    conditionText: 'Rook is orthogonally adjacent to friendly King with square in front empty.',
    effectText: 'Spawn 1 friendly Pawn onto empty square 1 rank in front of Rook.',
    description: 'Orthogonally adjacent to King: Spawn friendly Pawn onto empty square 1 rank in front.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },
  {
    id: 'q3_all_rise',
    code: 'Q3',
    name: 'Royal Shield',
    anchor: 'queen',
    world: 6,
    energyCost: 0,
    artId: 'q3_all_rise',
    conditionText: 'Friendly Pawn is 1 square away along ray with squares beyond.',
    effectText: 'Push Pawn along ray to target square and slide Queen 1 square behind it.',
    description: 'Pawn 1 square away along ray: Push Pawn to target and slide Queen 1 square behind it.',
    visualTheme: PIECE_COLOR_THEMES.queen
  },
  {
    id: 'k3_royal_execution',
    code: 'K3',
    name: 'Royal Execution',
    anchor: 'king',
    world: 6,
    energyCost: 0,
    artId: 'k3_royal_execution',
    conditionText: 'Enemy in King line of sight and friendly non-King piece is adjacent to King.',
    effectText: 'Launch adjacent friendly piece directly onto enemy piece to capture it.',
    description: 'Adjacent bodyguard and enemy in line of sight: Order bodyguard to strike and capture enemy.',
    visualTheme: PIECE_COLOR_THEMES.king
  },

  // --- WORLD 7: THE THRONE ROOM ---
  {
    id: 'n7_outpost_support',
    code: 'N7',
    name: 'Outpost Support',
    anchor: 'knight',
    world: 7,
    energyCost: 0,
    artId: 'n7_outpost_support',
    conditionText: 'Knight is on Ranks 5-8 with an empty rear-diagonal square.',
    effectText: 'Spawn a friendly Pawn onto an empty rear-diagonal square behind this Knight.',
    description: 'Knight on Ranks 5-8: Spawn reinforcing Pawn onto empty rear-diagonal square.',
    visualTheme: PIECE_COLOR_THEMES.knight
  },
  {
    id: 'p8_call_reserves',
    code: 'P8',
    name: 'Call Reserves',
    anchor: 'pawn',
    world: 7,
    energyCost: 0,
    artId: 'p8_call_reserves',
    conditionText: 'Pawn is on Ranks 5-7 with an empty rear-diagonal square.',
    effectText: 'Spawn a friendly Pawn onto an empty rear-diagonal square behind this Pawn.',
    description: 'Pawn on Ranks 5-7: Spawn reinforcing Pawn onto empty rear-diagonal square.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'b7_bishops_blessing',
    code: 'B7',
    name: "Bishop's Blessing",
    anchor: 'bishop',
    world: 7,
    energyCost: 0,
    artId: 'b7_bishops_blessing',
    conditionText: 'Friendly non-Bishop piece is in this Bishop\'s 8 surrounding squares.',
    effectText: 'Move adjacent ally along diagonals of its current square to move or capture.',
    description: 'Adjacent friendly piece: Bless ally to slide diagonally as a Bishop to move or capture.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'q4_one_fell_swoop',
    code: 'Q4',
    name: 'One Fell Swoop',
    anchor: 'queen',
    world: 7,
    energyCost: 0,
    artId: 'q4_one_fell_swoop',
    conditionText: 'Queen supported from behind by R/B/Q along shared ray with enemy units ahead.',
    effectText: 'Move Queen to end of ray, capturing every enemy unit along path in a single sweep.',
    description: 'Supported from behind along ray: Charge Queen to end of ray, sweeping all enemies.',
    visualTheme: PIECE_COLOR_THEMES.queen
  },
  {
    id: 'k4_banish',
    code: 'K4',
    name: 'Turncoat',
    anchor: 'king',
    world: 7,
    energyCost: 0,
    artId: 'k4_banish',
    conditionText: 'Enemy Pawn is in King\'s 8 surrounding squares.',
    effectText: 'Convert enemy Pawn in-place into friendly Pawn under your control.',
    description: 'Adjacent enemy Pawn: Convert enemy Pawn in-place into a friendly Pawn.',
    visualTheme: PIECE_COLOR_THEMES.king
  }
];
