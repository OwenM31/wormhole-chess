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
    conditionText: 'Pawn has enemy piece directly in front.',
    effectText: 'Step Pawn 1 square horizontally (left or right) onto an empty square.',
    description: 'Pawn blocked frontally: Step 1 square horizontally onto an empty square.',
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
    name: 'Follow Me',
    anchor: 'pawn',
    world: 1,
    energyCost: 0,
    artId: 'p3_follow_me',
    conditionText: 'Pawn has ally piece directly behind.',
    effectText: 'Move both ally Pawn and ally piece 1 square forward.',
    description: 'Ally directly behind: Advance both Pawn and trailing ally 1 square forward.',
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
    conditionText: 'Knight is targeting an ally piece.',
    effectText: 'Knight and ally piece swap places.',
    description: 'Targeting ally on L-jump landing: Knight and ally piece swap places.',
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
    conditionText: 'Pawn is threatening enemy piece and defended by ally Pawn.',
    effectText: 'Capture enemy piece and move defending ally Pawn into vacated square.',
    description: 'Defended by rear Pawn: Capture diagonally and step defending Pawn into origin.',
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
    conditionText: 'Pawn has ally piece on rear diagonal and empty square behind.',
    effectText: 'Move ally piece into empty square behind ally Pawn.',
    description: 'Ally on rear diagonal: Shift ally horizontally behind this Pawn.',
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
    conditionText: 'Pawn has ally piece directly in front.',
    effectText: 'Pawn and ally piece swap places.',
    description: 'Ally directly in front: Pawn and ally piece swap places.',
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
    conditionText: 'Pawn is pinned to your king.',
    effectText: "Destroy enemy piece on Pawn's forward diagonal without moving Pawn.",
    description: 'Pawn pinned to King: Destroy forward-diagonal enemy piece without moving.',
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
    conditionText: 'Pawn is in enemy territory and has an ally piece to left or right and an empty square behind.',
    effectText: 'Spawn additional Pawn into empty square behind Pawn.',
    description: 'Pawn in enemy half with flank ally: Spawn reserve Pawn directly behind.',
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
