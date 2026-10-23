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
    conditionText: 'Enemy piece is directly in front of this Pawn.',
    effectText: 'Step 1 square horizontally (left or right) onto an empty square.',
    description: 'Blocked frontally: Step 1 square horizontally left or right onto an empty square.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'p2_head_on',
    code: 'P2',
    name: 'Head On',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p2_head_on',
    conditionText: 'Enemy Pawn is directly in front of this Pawn.',
    effectText: 'Capture that enemy Pawn straight ahead.',
    description: 'Enemy Pawn directly in front: Capture that enemy Pawn straight ahead.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'p3_follow_me',
    code: 'P3',
    name: 'Follow Me',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p3_follow_me',
    conditionText: 'Friendly piece is directly behind this Pawn and square in front is empty.',
    effectText: 'Move both this Pawn and the friendly piece behind it 1 square straight forward.',
    description: 'Ally directly behind and front empty: Advance both pieces 1 square forward.',
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
    conditionText: 'This Knight is currently under attack by an enemy piece.',
    effectText: 'Jump 3 squares in one orthogonal direction and 1 square perpendicular (3x1 jump, move or capture).',
    description: 'Under attack: Leap 3 squares orthogonal and 1 perpendicular to move or capture.',
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
    conditionText: 'Friendly Pawn is 1 square diagonally in front of this Bishop.',
    effectText: 'Swap places with that friendly Pawn.',
    description: 'Friendly Pawn 1 diagonal square ahead: Swap places with that Pawn.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'n2_swap_with_me',
    code: 'N2',
    name: 'Swap With Me',
    anchor: 'knight',
    world: 1,
    energyCost: 0,
    artId: 'n2_swap_with_me',
    conditionText: 'Friendly piece sits on one of this Knight\'s normal (2,1) L-jump squares.',
    effectText: 'Swap places with that friendly piece.',
    description: 'Ally on normal L-jump landing: Swap places with that friendly piece.',
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
    conditionText: 'At least 1 enemy Pawn lies on the 2-square straight leg of normal (2,1) L-jump.',
    effectText: 'Jump onto empty landing square and destroy any enemy Pawns on that 2-square straight leg.',
    description: 'Enemy Pawn on 2-square straight jump leg: Leap to empty landing and trample that Pawn.',
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
    conditionText: 'Friendly unit sits on same rank unobstructed and square 1 in front of that unit is empty.',
    effectText: 'Push friendly unit 1 square straight forward and slide Rook into square it vacated.',
    description: 'Ally on unobstructed rank with front empty: Push ally forward 1 square and take its tile.',
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
    conditionText: 'Exactly 1 enemy Pawn sits on unobstructed diagonal with at least 1 empty square beyond it.',
    effectText: 'Slide through enemy Pawn, destroying it and landing on unobstructed empty square beyond.',
    description: 'Diagonal blocked by lone enemy Pawn: Pierce through Pawn to empty square beyond.',
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
    conditionText: 'This Pawn is defended by a friendly Pawn on a rear-diagonal square.',
    effectText: 'Capture enemy piece diagonally, and move defending friendly Pawn into square vacated.',
    description: 'Defended by rear Pawn: Capture diagonally and advance defending Pawn into vacated square.',
    visualTheme: PIECE_COLOR_THEMES.pawn
  },
  {
    id: 'n4_pin_swap',
    code: 'N4',
    name: 'Pin Swap',
    anchor: 'knight',
    world: 3,
    energyCost: 0,
    artId: 'n4_pin_swap',
    conditionText: 'This Knight is pinned to your King.',
    effectText: 'Swap places with any friendly piece in 8 surrounding squares if resulting King is safe.',
    description: 'Knight pinned to King: Swap places with adjacent friendly piece while keeping King safe.',
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
    conditionText: 'Knight is on outer file (a or h) and you have another friendly Knight on board.',
    effectText: 'Make normal Knight jump with outer Knight, and move other friendly Knight into vacated square.',
    description: 'Outer-file Knight with second Knight: Jump outer Knight and teleport second Knight to origin.',
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
    conditionText: 'Friendly piece on rear diagonal behind Pawn, and square directly behind Pawn is empty.',
    effectText: 'Move that friendly piece 1 square horizontally into empty square directly behind Pawn.',
    description: 'Ally on rear diagonal with square behind empty: Pull ally horizontally behind this Pawn.',
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
    conditionText: 'Bishop is on home corner square (a1 or h1 relative to owner).',
    effectText: 'Step 1 square orthogonally onto empty adjacent square, permanently switching square color.',
    description: 'Bishop on home corner: Step 1 square orthogonally onto empty square to switch colors.',
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
    conditionText: 'Your King is currently in check.',
    effectText: 'Jump Knight from anywhere on board to empty square adjacent to King that blocks check.',
    description: 'King in check: Jump Knight anywhere to empty tile adjacent to King that resolves check.',
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
    conditionText: 'This Bishop is pinned to your King.',
    effectText: 'Swap places with a friendly piece along any of this Bishop\'s unobstructed diagonals.',
    description: 'Bishop pinned to King: Swap places with friendly piece along unobstructed diagonal.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },
  {
    id: 'b6_come_this_way',
    code: 'B6',
    name: 'Come This Way',
    anchor: 'bishop',
    world: 4,
    energyCost: 0,
    artId: 'b6_come_this_way',
    conditionText: 'Bishop is on center square (d4, d5, e4, e5) and friendly Pawn lies on diagonal.',
    effectText: 'Pull friendly Pawn along diagonal to square 1 tile diagonally adjacent to Bishop.',
    description: 'Bishop in center: Pull friendly Pawn along diagonal adjacent to Bishop.',
    visualTheme: PIECE_COLOR_THEMES.bishop
  },

  // --- WORLD 5: THE ARMORY ---
  {
    id: 'p6_tag_out',
    code: 'P6',
    name: 'Tag Out',
    anchor: 'pawn',
    world: 5,
    energyCost: 0,
    artId: 'p6_tag_out',
    conditionText: 'Friendly piece is directly in front of this Pawn.',
    effectText: 'Swap places with that friendly piece.',
    description: 'Ally directly in front: Swap places with that friendly piece.',
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
    conditionText: 'Two friendly Rooks share same rank or file with no pieces between them.',
    effectText: 'Slide both Rooks same distance in perpendicular direction (empty or capture).',
    description: 'Paired Rooks on line: Slide both Rooks identical distance in perpendicular direction.',
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
    conditionText: 'Friendly Pawn lies on Queen\'s unobstructed rank or file at distance >= 2.',
    effectText: 'Move that friendly Pawn along rank or file onto empty square adjacent to Queen.',
    description: 'Ally Pawn in line of sight: Summon Pawn along rank or file adjacent to Queen.',
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
    conditionText: 'Friendly non-King piece is directly behind Rook and enemy non-King lies along ray ahead.',
    effectText: 'Launch friendly piece over Rook to capture that enemy unit (Rook stays in place).',
    description: 'Ally behind Rook and enemy ahead: Launch rear ally over Rook to capture enemy target.',
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
    conditionText: 'King is on home corner (a1 or h1 relative to owner) with empty adjacent square.',
    effectText: 'Spawn friendly Pawn onto each empty adjacent square (up to 2 Pawns; Rank 1 Pawn steps to Rank 2).',
    description: 'King in home corner: Conscript friendly Pawns onto empty orthogonally adjacent tiles.',
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
    conditionText: 'This Pawn is pinned to your King.',
    effectText: 'Destroy enemy non-King piece on forward-diagonal capture square without moving Pawn.',
    description: 'Pawn pinned to King: Strike enemy piece on forward-diagonal capture square without moving.',
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
    conditionText: 'King is directly behind Rook and square directly in front of Rook is empty.',
    effectText: 'Spawn 1 friendly Pawn onto empty square directly in front of Rook.',
    description: 'King directly behind Rook: Spawn friendly Pawn onto empty square directly in front.',
    visualTheme: PIECE_COLOR_THEMES.rook
  },
  {
    id: 'q3_all_rise',
    code: 'Q3',
    name: 'All Rise',
    anchor: 'queen',
    world: 6,
    energyCost: 0,
    artId: 'q3_all_rise',
    conditionText: 'Queen is on Ranks 2-8 and at least one friendly Pawn on lower rank has front square empty.',
    effectText: 'Advance every friendly Pawn on strictly lower rank 1 square forward if unobstructed.',
    description: 'Queen on rank 2-8: Advance all friendly Pawns on lower ranks 1 square straight forward.',
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
    conditionText: 'Friendly unit is adjacent to King, and enemy occupies square ally could capture from King.',
    effectText: 'Move friendly unit directly onto enemy unit square, capturing it.',
    description: 'Adjacent ally with sightline from King: Order ally to strike and capture enemy target.',
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
    conditionText: 'Knight is on Ranks 5-8, defended by rear-diagonal Pawn, with other rear-diagonal empty.',
    effectText: 'Spawn friendly Pawn onto empty rear-diagonal square behind Knight.',
    description: 'Knight outpost on enemy half: Spawn reinforcing Pawn onto empty rear-diagonal square.',
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
    conditionText: 'Pawn is on Ranks 5-7, has horizontal friendly piece, and square behind is empty.',
    effectText: 'Spawn friendly Pawn onto empty square directly behind this Pawn.',
    description: 'Advanced Pawn with flank ally: Call reserve Pawn onto empty square directly behind.',
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
    conditionText: 'Friendly piece (including King) is directly behind Bishop.',
    effectText: 'Move friendly piece unobstructed along diagonals of its current color (Bishop stays).',
    description: 'Ally behind Bishop: Bless ally to slide diagonally as a Bishop to move or capture.',
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
    conditionText: 'Queen supported from behind by adjacent R/B/Q along shared ray with enemy units ahead.',
    effectText: 'Move Queen to end of ray, capturing every enemy unit along path in a single sweep.',
    description: 'Supported from behind along ray: Charge Queen to end of ray, sweeping all enemies.',
    visualTheme: PIECE_COLOR_THEMES.queen
  },
  {
    id: 'k4_banish',
    code: 'K4',
    name: 'Banish',
    anchor: 'king',
    world: 7,
    energyCost: 0,
    artId: 'k4_banish',
    conditionText: 'First unit in King file is enemy on Ranks 1-4 with contiguous enemy stack on Ranks 1-4.',
    effectText: 'Push contiguous enemy stack backward along file toward Rank 8 as rigid block.',
    description: 'Enemy stack in front on ranks 1-4: Banish enemy stack backward along file toward rank 8.',
    visualTheme: PIECE_COLOR_THEMES.king
  }
];
