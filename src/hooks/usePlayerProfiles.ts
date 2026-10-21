import { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, ProfileGear } from '../types/deckChess';
import { CANONICAL_36_CARDS } from '../engine/cards/releaseRoster36';

const STORAGE_KEY = 'wc_deck_profiles_v3';
const ACTIVE_SLOT_KEY = 'wc_deck_active_slot_v3';

const ALL_36_IDS = CANONICAL_36_CARDS.map((c) => c.id);
const STARTER_8_IDS = CANONICAL_36_CARDS.slice(0, 8).map((c) => c.id);

function createDefaultProfiles(): Record<string, PlayerProfile> {
  const maxCopiesMap: Record<string, number> = {};
  ALL_36_IDS.forEach((id) => {
    maxCopiesMap[id] = 5;
  });

  return {
    slot_1: {
      id: 'slot_1',
      name: 'Wooden Pawn',
      level: 1,
      gold: 240,
      playtestAll36: true,
      unlockedCards: [...ALL_36_IDS],
      copyLimits: { ...maxCopiesMap },
      handSize: 8,
      equippedHand: [...STARTER_8_IDS],
      gear: {
        material: 'Carved Oak',
        headgear: 'None',
        base: 'Tavern Coin',
      },
    },
    slot_2: {
      id: 'slot_2',
      name: 'Campaign Recruit',
      level: 1,
      gold: 50,
      playtestAll36: false,
      unlockedCards: ['p1_sidestep'],
      copyLimits: { p1_sidestep: 1 },
      handSize: 8,
      equippedHand: ['p1_sidestep'],
      gear: {
        material: 'Fresh Pine',
        headgear: 'None',
        base: 'Pebble',
      },
    },
    slot_3: {
      id: 'slot_3',
      name: 'Grandmaster Trial',
      level: 5,
      gold: 1200,
      playtestAll36: true,
      unlockedCards: [...ALL_36_IDS],
      copyLimits: { ...maxCopiesMap },
      handSize: 8,
      equippedHand: [...STARTER_8_IDS],
      gear: {
        material: 'Obsidian Iron',
        headgear: 'Iron Helm',
        base: 'Granite Pedestal',
      },
    },
  };
}

export function usePlayerProfiles() {
  const [profiles, setProfiles] = useState<Record<string, PlayerProfile>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.slot_1) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return createDefaultProfiles();
  });

  const [activeSlotId, setActiveSlotId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SLOT_KEY);
      if (saved && ['slot_1', 'slot_2', 'slot_3'].includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'slot_1';
  });

  // Persist whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch {
      // storage quota or disabled
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, activeSlotId);
    } catch {
      // storage quota or disabled
    }
  }, [activeSlotId]);

  const activeProfile: PlayerProfile = profiles[activeSlotId] || profiles.slot_1 || createDefaultProfiles().slot_1;

  const switchProfile = useCallback((slotId: string) => {
    if (profiles[slotId]) {
      setActiveSlotId(slotId);
    }
  }, [profiles]);

  const updateProfileName = useCallback((newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProfiles((prev) => ({
      ...prev,
      [activeSlotId]: {
        ...prev[activeSlotId],
        name: trimmed,
      },
    }));
  }, [activeSlotId]);

  const createOrResetProfile = useCallback((slotId: string, name?: string, playtestAll36: boolean = true) => {
    const defaults = createDefaultProfiles();
    const template = defaults[slotId] || defaults.slot_1;

    const maxCopiesMap: Record<string, number> = {};
    ALL_36_IDS.forEach((id) => {
      maxCopiesMap[id] = playtestAll36 ? 5 : 1;
    });

    const newProfile: PlayerProfile = {
      ...template,
      id: slotId,
      name: name || (playtestAll36 ? 'Playtest Champion' : 'New Challenger'),
      playtestAll36,
      unlockedCards: playtestAll36 ? [...ALL_36_IDS] : ['p1_sidestep'],
      copyLimits: playtestAll36 ? maxCopiesMap : { p1_sidestep: 1 },
      handSize: 8,
      equippedHand: playtestAll36 ? [...STARTER_8_IDS] : ['p1_sidestep'],
    };

    setProfiles((prev) => ({
      ...prev,
      [slotId]: newProfile,
    }));
    setActiveSlotId(slotId);
  }, []);

  const setHandSize = useCallback((size: number) => {
    const clamped = Math.max(1, Math.min(8, Math.floor(size)));
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          handSize: clamped,
          equippedHand: cur.equippedHand.slice(0, clamped),
        },
      };
    });
  }, [activeSlotId]);

  const getMaxCopiesForCard = useCallback((cardId: string): number => {
    if (activeProfile.playtestAll36) return 5;
    return activeProfile.copyLimits[cardId] || 1;
  }, [activeProfile]);

  const getEquippedCopiesForCard = useCallback((cardId: string): number => {
    return activeProfile.equippedHand.filter((id) => id === cardId).length;
  }, [activeProfile]);

  const equipCard = useCallback((cardId: string): boolean => {
    if (activeProfile.equippedHand.length >= activeProfile.handSize) return false;
    const maxAllowed = getMaxCopiesForCard(cardId);
    const currentCount = getEquippedCopiesForCard(cardId);
    if (currentCount >= maxAllowed) return false;

    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          equippedHand: [...cur.equippedHand, cardId],
        },
      };
    });
    return true;
  }, [activeProfile, activeSlotId, getMaxCopiesForCard, getEquippedCopiesForCard]);

  const unequipCardAtIndex = useCallback((index: number) => {
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      const copy = [...cur.equippedHand];
      copy.splice(index, 1);
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          equippedHand: copy,
        },
      };
    });
  }, [activeSlotId]);

  const clearHand = useCallback(() => {
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          equippedHand: [],
        },
      };
    });
  }, [activeSlotId]);

  const autoFillHand = useCallback(() => {
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      const pool = cur.unlockedCards.length > 0 ? cur.unlockedCards : ALL_36_IDS;
      const targetSize = cur.handSize || 8;
      const newHand: string[] = [];
      for (let i = 0; i < targetSize; i++) {
        newHand.push(pool[i % pool.length]);
      }
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          equippedHand: newHand,
        },
      };
    });
  }, [activeSlotId]);

  const togglePlaytestMode = useCallback(() => {
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      const nextMode = !cur.playtestAll36;
      const maxCopiesMap: Record<string, number> = {};
      ALL_36_IDS.forEach((id) => {
        maxCopiesMap[id] = nextMode ? 5 : 1;
      });

      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          playtestAll36: nextMode,
          unlockedCards: nextMode ? [...ALL_36_IDS] : ['p1_sidestep'],
          copyLimits: nextMode ? maxCopiesMap : { p1_sidestep: 1 },
          equippedHand: nextMode
            ? cur.equippedHand.length > 0 ? cur.equippedHand : [...STARTER_8_IDS]
            : ['p1_sidestep'],
        },
      };
    });
  }, [activeSlotId]);

  const updateGear = useCallback((gearUpdate: Partial<ProfileGear>) => {
    setProfiles((prev) => {
      const cur = prev[activeSlotId];
      if (!cur) return prev;
      return {
        ...prev,
        [activeSlotId]: {
          ...cur,
          gear: {
            ...cur.gear,
            ...gearUpdate,
          },
        },
      };
    });
  }, [activeSlotId]);

  return {
    profiles,
    activeSlotId,
    activeProfile,
    switchProfile,
    updateProfileName,
    createOrResetProfile,
    setHandSize,
    getMaxCopiesForCard,
    getEquippedCopiesForCard,
    equipCard,
    unequipCardAtIndex,
    clearHand,
    autoFillHand,
    togglePlaytestMode,
    updateGear,
  };
}
