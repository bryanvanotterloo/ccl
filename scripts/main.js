let last_date = Date.now()
let last_save = 0

let reset_chances = 10

function load_data() {
    let base_data = {
        persist: {
            currencies: {
                research: 0,
                prestige_points: 0,
                ascension_points: 0,
                transcendence_points: 0
            },
            upgrades: {

            },
            unlocks: {
                upgrades: false,
                combat: false,
                extended_upgrades: false,
                prestige: false,
                prestige_upgrades: false,
                ascension: false,
                transcendence: false
            },
            layers: {
                prestige: 0,
                ascension: 0,
                max_floor_this_ascension: 0,
                transcendence: 0
            },
            other: {
                settings: {
                    cool_font: true,
                    hide_complete_upgrades: false
                },
                time_played: 0,
                runs_started: 0,

                records: {
                    floor: 0
                }
            }
        },
        non_persist: {
            run_active: false,
            run: {
                floor: 1,
                progress: 0,
                move_tick: 0,

                in_combat: false,
                attack_tick: 0,
                enemy: null,
                enemy_kills: 0,

                character_stats: {},
                enemies: []
            }
        }
    }

    if (localStorage.getItem("save_data") != null) {
        base_data.persist = JSON.parse(localStorage.getItem("save_data"))
    }

    // Default fields missing from older saves
    base_data.persist.layers.transcendence ??= 0
    base_data.persist.layers.max_floor_this_ascension ??= 0
    base_data.persist.currencies.transcendence_points ??= 0

    // Migrate old upgrade names to new ones
    const upgradeMigrations = {
        "transcendent_research": "ascended_research",
        "transcendent_courage": "ascended_courage",
        "transcendent_health": "ascended_health",
        "transcendent_defense": "ascended_defense"
    }

    for (const [oldName, newName] of Object.entries(upgradeMigrations)) {
        if (base_data.persist.upgrades[oldName] != null) {
            base_data.persist.upgrades[newName] = base_data.persist.upgrades[oldName]
            delete base_data.persist.upgrades[oldName]
        }
    }

    // Rebalance lowered many max levels; clamp old saves to the new caps
    Object.values(upgrades_list).flat().forEach((upgrade) => {
        if (base_data.persist.upgrades[upgrade.id] > upgrade.max_level) {
            base_data.persist.upgrades[upgrade.id] = upgrade.max_level
        }
    })

    // Courage Nexus was removed; refund its cost
    if (base_data.persist.upgrades.courage_nexus > 0) {
        base_data.persist.currencies.transcendence_points += 5
    }
    delete base_data.persist.upgrades.courage_nexus

    return base_data
}

// Save codes are the persist data as base64-encoded JSON
function encode_save(persist) {
    let bytes = new TextEncoder().encode(JSON.stringify(persist))
    let binary = ""
    bytes.forEach((b) => binary += String.fromCharCode(b))
    return btoa(binary)
}

// Returns the decoded persist data, or throws if the code isn't a valid save
function decode_save(code) {
    code = code.trim()
    let json = code
    if (!code.startsWith("{")) {
        let binary = atob(code.replace(/\s/g, ""))
        json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
    }

    let persist = JSON.parse(json)
    for (const key of ["currencies", "upgrades", "unlocks", "layers", "other"]) {
        if (persist == null || typeof persist[key] != "object" || persist[key] == null) {
            throw new Error("missing " + key)
        }
    }
    return persist
}

function set_save_transfer_status(text, is_error) {
    let status = document.getElementById("save_transfer_status")
    status.innerHTML = text
    status.dataset.error = is_error
}

function import_save(code) {
    let persist
    try {
        persist = decode_save(code)
    } catch (e) {
        set_save_transfer_status("That doesn't look like a valid save code.", true)
        return
    }

    if (!confirm("Importing will overwrite your current progress. Continue?")) {
        return
    }

    localStorage.setItem("save_data", JSON.stringify(persist))
    window.location.reload()
}

let enemy_graphic_order = [
    "images/enemy_zombie_icon.png",
    "images/enemy_slime_icon.png",
    "images/enemy_skeleton_icon.png"
]

let upgrades_list = {
    basic: [
        // Torch Upgrades
        {
            id: "torch",
            name: "Torch",
            description: "You should probably bring a light source with you. Slows down courage loss.",
            effect: {
                amount: {
                    type: "flat",
                    value: 0.25
                },
                prefix: "+",
                suffix: "Courage/s"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "flat_constant",
                    value: 0.5
                },
                prefix: "",
                suffix: "Research"
            },

            max_level: 1
        },

        {
            id: "torch_buff",
            name: "Torch Power",
            description: "Make your torch shine brighter than before.. Slows down courage loss further.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05,
                },
                prefix: "+",
                suffix: " Courage/s"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 0.25,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "torch"
                    }
                ]
            },

            max_level: 15
        },

        {
            id: "torch_buff1",
            name: "Torch Power+",
            description: "A brighter flame keeps the dark at bay. Lose courage slower.",
            effect: {
                amount: {
                    type: "increment",
                    value: 5
                },
                prefix: "-",
                suffix: "% Courage Loss"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "torch_buff",
                        amount: 5
                    }
                ]
            },

            max_level: 10
        },

        // Extended Upgrades

        {
            id: "swallow_inhibitions",
            name: "Swallow your inhibitions",
            description: "You might not want to be here, but you have something in mind here. Start with more courage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Courage"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 0.75,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "torch"
                    }
                ]
            },

            max_level: 15
        },

        {
            id: "basic_routine",
            name: "Versed Routine",
            description: "Solve your other problems first, then come try again. Start with even more courage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Courage"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 5,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "swallow_inhibitions",
                        amount: 5
                    }
                ]
            },

            max_level: 25
        },

        {
            id: "careful_looking",
            name: "Careful Looking",
            description: "Take note of everything, even if it kind of creeps you out. Gain more Research but lose 10% more courage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.2,
                },
                prefix: "+",
                suffix: "x Research"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "torch"
                    }
                ]
            },

            max_level: 15
        },

        {
            id: "growing_pace",
            name: "Panicked Pace",
            description: "Never too late to pick up the pace! The less courage you have, the faster you move.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05
                },
                prefix: "+",
                suffix: "x Speed (at 0 courage)"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.35
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "torch"
                    },
                    {
                        name: "careful_looking"
                    }
                ]
            },

            max_level: 20
        },

        {
            id: "auto_delve",
            name: "Auto. Delve",
            description: "Hire a friend to go into the cavern for you. Beats going in there yourself.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "Automatic Delving",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "research",
                amount: {
                    type: "flat_constant",
                    value: 25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 1
        },

        // Extended Upgrades

        {
            id: "compound_research",
            name: "Compounding Discoveries",
            description: "The deeper you go, the more everything before makes sense. Earn 10% more research per floor you've passed this run.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1,
                },
                prefix: "+",
                suffix: "x Research"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 10,
                    multiplier: 1.341
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 30
        },

        {
            id: "compound_courage",
            name: "Mental Endurance",
            description: "It's mindnumbing how many times you've gone through the caverns. Lose courage slower.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 0.9
                },
                prefix: "",
                suffix: "x Courage Loss"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 20,
                    multiplier: 1.4
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 10
        },

        {
            id: "cartography",
            name: "Cartography",
            description: "Sketch a map as you go. Move faster through the caverns.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05,
                },
                prefix: "+",
                suffix: "x Move Speed"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 15,
                    multiplier: 1.3
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 10
        },

        {
            id: "lucky_find",
            name: "Lucky Find",
            description: "There's always something shiny on the ground. Earn extra research for every floor you pass.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.25,
                },
                prefix: "+",
                suffix: "Research/Floor"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 8,
                    multiplier: 1.308
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 25
        },

        {
            id: "second_wind",
            name: "Second Wind",
            description: "Made it this far, might as well keep going. Restore courage whenever you reach a new floor.",
            effect: {
                amount: {
                    type: "increment",
                    value: 2,
                },
                prefix: "+",
                suffix: "% Max Courage/Floor"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 30,
                    multiplier: 1.6
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 10
        },
    ],

    combat: [
        {
            id: "train_endurance",
            name: "Endurance Training",
            description: "Better get it in now. Increases health.",
            effect: {
                amount: {
                    type: "increment",
                    value: 2
                },
                prefix: "+",
                suffix: "Health"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 5,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 25
        },

        {
            id: "train_agility",
            name: "Agility Training",
            description: "Make fights go quicker. Increases attack speed.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1,
                },
                prefix: "+",
                suffix: "x Attack Speed"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 5,
                    multiplier: 1.3
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 20
        },

        {
            id: "combat_sword",
            name: "Prepare Sword",
            description: "Best be prepared for the next fight. Slows down courage loss by 10% and increases attack power.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Attack"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 5,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 30
        },

        {
            id: "enhance_sword",
            name: "Enhance Sword",
            description: "Sharpen and reinforce your blade. Multiplies attack.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1
                },
                prefix: "+",
                suffix: "x Attack"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 100,
                    multiplier: 1.438
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "combat_sword",
                        amount: 10
                    }
                ],
                unlocks: [
                    "combat",
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },

        {
            id: "combat_armor",
            name: "Prepare Armor",
            description: "Would be good to be able to take a few hits. Slows down courage loss by 10% and increases defense.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Defense"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 10,
                    multiplier: 1.239
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 30
        },

        {
            id: "enhance_armor",
            name: "Enhance Armor",
            description: "Reinforce your armor plating. Multiplies defense.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1
                },
                prefix: "+",
                suffix: "x Defense"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 600,
                    multiplier: 1.309
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "combat_armor",
                        amount: 10
                    }
                ],
                unlocks: [
                    "combat",
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },

        {
            id: "combat_boots",
            name: "Prepare Boots",
            description: "Would be good to ease the foot pain. Slows down courage loss by 10% and increases move speed.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1,
                },
                prefix: "+",
                suffix: "x Move Speed"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 5,
                    multiplier: 1.3
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 20
        },

        {
            id: "enemy_bounty",
            name: "Bounty Hunter",
            description: "If you're gonna kill things, you might as well understand them better. Gain research on kill.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.5,
                },
                prefix: "+",
                suffix: " Research/kill"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 7.5,
                    multiplier: 1.251
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 30
        },

        {
            id: "slow_recover",
            name: "Slow Recovery",
            description: "Regenerate health when outside of combat.",
            effect: {
                amount: {
                    type: "multiply_effect",
                    value: 0.125,
                    multiplier: 1.5
                },
                prefix: "+",
                suffix: "Health/s"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 15,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "combat",
                    "extended_upgrades"
                ]
            },

            max_level: 15
        },

        {
            id: "well_cheers",
            name: "Well cheers!",
            description: "(Locks Feelin' fine)<br>As long as your spirit's up, nothing can stop you. While courage is above 50%, lose 25% less courage and regenerate health.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05,
                },
                prefix: "+",
                suffix: "Health/s"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 10,
                    multiplier: 1.239
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "feeling_fine",
                        amount: -1
                    }
                ],
                unlocks: [
                    "combat",
                    "extended_upgrades"
                ]
            },

            max_level: 30
        },

        {
            id: "feeling_fine",
            name: "Feelin' fine",
            description: "(Locks Well cheers!)<br>I'll just walk it off. While health is above 50%, gain 1 defense and regenerate courage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05,
                },
                prefix: "+",
                suffix: "Courage/s"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 12.5,
                    multiplier: 1.229
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                upgrades: [
                    {
                        name: "well_cheers",
                        amount: -1
                    }
                ],
                unlocks: [
                    "combat",
                    "extended_upgrades"
                ]
            },

            max_level: 30
        },

        {
            id: "critical_strike",
            name: "Critical Strike",
            description: "Aim for the weak spots. Gain a chance for attacks to deal double damage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 5,
                },
                prefix: "+",
                suffix: "% Crit Chance"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 20,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "combat",
                    "extended_upgrades"
                ]
            },

            max_level: 10
        },

        {
            id: "bloodlust",
            name: "Bloodlust",
            description: "Nothing like a good fight to get the blood pumping. Heal whenever you defeat an enemy.",
            effect: {
                amount: {
                    type: "increment",
                    value: 3,
                },
                prefix: "+",
                suffix: "% Max Health/Kill"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 25,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "combat",
                    "extended_upgrades"
                ]
            },

            max_level: 10
        },

        {
            id: "trophy_hunter",
            name: "Trophy Hunter",
            description: "Every kill is a story to tell. Regain more courage when you defeat an enemy.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "% Max Courage/Kill"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 10,
                    multiplier: 1.4
                },
                prefix: "",
                suffix: "Research"
            },

            requirements: {
                unlocks: [
                    "combat"
                ]
            },

            max_level: 15
        },
    ],
    prestige: [
        {
            id: "prestige_research",
            name: "P-Research",
            description: "Multiply research gain.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.5
                },
                prefix: "x",
                suffix: " Research"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "increment_cost",
                    value: 1
                },
                prefix: "",
                suffix: "Prestige Points"
            },
            
            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },
        {
            id: "prestige_courage",
            name: "P-Courage",
            description: "Start with significantly more courage.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.25,
                },
                prefix: "+",
                suffix: "x Courage"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "increment_cost",
                    value: 1
                },
                prefix: "",
                suffix: "Prestige Points"
            },
            
            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },
        {
            id: "prestige_courage_loss",
            name: "P-Courage Retention",
            description: "Lose courage significantly slower.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 0.95
                },
                prefix: "",
                suffix: "x Courage Loss"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "increment_cost",
                    value: 1
                },
                prefix: "",
                suffix: "Prestige Points"
            },
            
            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },
        {
            id: "prestige_health",
            name: "P-Health",
            description: "Multiply max health.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.2
                },
                prefix: "x",
                suffix: " Health"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "increment_cost",
                    value: 1
                },
                prefix: "",
                suffix: "Prestige Points"
            },
            
            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 25
        },
        {
            id: "prestige_defense",
            name: "P-Defense",
            description: "Multiply defense.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.2
                },
                prefix: "x",
                suffix: " Defense"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.152
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 25
        },
        {
            id: "prestige_attack",
            name: "P-Attack",
            description: "Multiply attack power.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.2
                },
                prefix: "x",
                suffix: " Attack"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.152
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 25
        },
        {
            id: "auto_shop",
            name: "Auto. Shop",
            description: "Automatically buy the cheapest available item from basic and combat shops.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "Automatic Purchasing",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "flat_constant",
                    value: 5
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 1
        },
        {
            id: "prestige_speed",
            name: "P-Speed",
            description: "Multiply move speed.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.12
                },
                prefix: "x",
                suffix: " Move Speed"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.196
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },
        {
            id: "prestige_agility",
            name: "P-Agility",
            description: "Multiply attack speed.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.1
                },
                prefix: "x",
                suffix: " Attack Speed"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.196
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 20
        },
        {
            id: "head_start",
            name: "Head Start",
            description: "Start each prestige with extra research.",
            effect: {
                amount: {
                    type: "increment",
                    value: 25
                },
                prefix: "+",
                suffix: " Starting Research"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 1.395
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 10
        },
    ],
    ascension: [
        {
            id: "eternal_scaling",
            name: "Eternal Scaling",
            description: "Reduce all upgrade costs over time.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.05,
                },
                prefix: "-",
                suffix: "x Upgrade Costs"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "paradox_engine",
            name: "Paradox Engine",
            description: "Prestige points earned are multiplied.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.5
                },
                prefix: "x",
                suffix: " Prestige Gain"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.75
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 5
        },
        {
            id: "ascended_research",
            name: "Ascended Research",
            description: "Multiply research gain.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 2
                },
                prefix: "x",
                suffix: " Research"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "ascended_courage",
            name: "Ascended Courage",
            description: "Multiply max courage.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.19
                },
                prefix: "x",
                suffix: " Max Courage"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 15
        },
        {
            id: "ascended_health",
            name: "Ascended Health",
            description: "Multiply max health.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.6
                },
                prefix: "x",
                suffix: " Health"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "ascended_defense",
            name: "Ascended Defense",
            description: "Multiply defense.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.6
                },
                prefix: "x",
                suffix: " Defense"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "ascended_attack",
            name: "Ascended Attack",
            description: "Multiply attack power.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.37
                },
                prefix: "x",
                suffix: " Attack"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 15
        },
        {
            id: "momentum",
            name: "Momentum",
            description: "Prestige points carry over to the next ascension layer.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "10% Prestige Carryover",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "flat_constant",
                    value: 5
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 1
        },
        {
            id: "ascended_speed",
            name: "Ascended Speed",
            description: "Multiply move speed.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.25
                },
                prefix: "x",
                suffix: " Move Speed"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "ascended_insight",
            name: "Ascended Insight",
            description: "Ascension points earned are multiplied.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1
                },
                prefix: "+",
                suffix: "x Ascension Gain"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "ascended_vigor",
            name: "Ascended Vigor",
            description: "Multiply attack speed.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.26
                },
                prefix: "x",
                suffix: " Attack Speed"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.4
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
    ],
    transcendence: [
        {
            id: "ascendant_form",
            name: "Ascendant Form",
            description: "Gain a flat boost to all stats.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.01,
                },
                prefix: "+",
                suffix: "x All Stats"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.1
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: Infinity
        },
        {
            id: "infinite_recursion",
            name: "Infinite Recursion",
            description: "Transcendence points are earned faster.",
            effect: {
                amount: {
                    type: "multiply_effect",
                    value: 1.2,
                    multiplier: 1.2
                },
                prefix: "x",
                suffix: " Transcendence Gain"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 10
        },
        {
            id: "dimensional_echo",
            name: "Dimensional Echo",
            description: "Gain a percentage of your total research each second.",
            effect: {
                amount: {
                    type: "increment",
                    value: .05,
                },
                prefix: "+",
                suffix: "% Research/s"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 1.75
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 5
        },
        {
            id: "cascade_reaction",
            name: "Cascade Reaction",
            description: "Upgrade cost reductions stack multiplicatively.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.01,
                },
                prefix: "",
                suffix: "Multiplicative Stacking"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 4,
                    multiplier: 1.75
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 5
        },
        {
            id: "beyond_infinity",
            name: "Beyond Infinity",
            description: "Keep part of your prestige upgrade levels when you ascend.",
            effect: {
                amount: {
                    type: "increment",
                    value: 33.3
                },
                prefix: "",
                suffix: "% Prestige Upgrades Kept"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 2.5
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 3
        },
        {
            id: "cosmic_engine",
            name: "Cosmic Engine",
            description: "Gain a percentage of prestige points per second.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "0.1% Prestige/s",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "flat_constant",
                    value: 20
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 1
        },
        {
            id: "timeless_knowledge",
            name: "Timeless Knowledge",
            description: "Research is multiplied.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "x Research"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 10
        },
        {
            id: "transcendent_might",
            name: "Transcendent Might",
            description: "Multiply attack and max health.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 2.5
                },
                prefix: "x",
                suffix: " Attack & Health"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 1.75
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 5
        },
        {
            id: "eternal_resolve",
            name: "Eternal Resolve",
            description: "Multiply max courage.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.26
                },
                prefix: "x",
                suffix: " Max Courage"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 10
        },
        {
            id: "phase_step",
            name: "Phase Step",
            description: "Multiply move speed and attack speed.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 1.26
                },
                prefix: "x",
                suffix: " Move & Attack Speed"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.43
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 10
        },
        {
            id: "transcendent_guard",
            name: "Transcendent Guard",
            description: "Multiply defense.",
            effect: {
                amount: {
                    type: "power",
                    multiplier: 2.5
                },
                prefix: "x",
                suffix: " Defense"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 1.75
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 5
        },
        {
            id: "starting_spark",
            name: "Starting Spark",
            description: "Keep part of your ascension upgrade levels when you transcend.",
            effect: {
                amount: {
                    type: "increment",
                    value: 33.3
                },
                prefix: "",
                suffix: "% Ascension Upgrades Kept"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 2.5
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 3
        },
    ]
}

function can_afford_upgrade(data, currency, price) {
    return data.persist.currencies[currency] >= price
}

function find_cheapest_upgrade(data, categories) {
    let cheapest = null
    let lowest_cost = Infinity

    categories.forEach((category) => {
        upgrades_list[category].forEach((upgrade) => {
            if (!is_upgrade_available(data, upgrade)) {
                return
            }

            let current_level = data.persist.upgrades[upgrade.id] || 0
            if (current_level >= upgrade.max_level) {
                return
            }

            let cost = evaluate_dynamic_amount(upgrade.cost.amount, current_level)
            cost *= (data.persist.upgrades.eternal_scaling > 0? 1 - (0.05 * data.persist.upgrades.eternal_scaling) : 1)
            cost *= (data.persist.upgrades.cascade_reaction > 0? 1 - (0.05 * Math.min(data.persist.upgrades.cascade_reaction, 5)) : 1)

            if (!can_afford_upgrade(data, upgrade.cost.currency, cost)) {
                return
            }

            if (cost < lowest_cost) {
                cheapest = { upgrade, cost, category }
                lowest_cost = cost
            }
        })
    })

    return cheapest
}

function find_most_expensive_upgrade(data, categories) {
    let most_expensive = null
    let highest_cost = 0

    categories.forEach((category) => {
        upgrades_list[category].forEach((upgrade) => {
            if (!is_upgrade_available(data, upgrade)) {
                return
            }

            let current_level = data.persist.upgrades[upgrade.id] || 0
            if (current_level >= upgrade.max_level) {
                return
            }

            let cost = evaluate_dynamic_amount(upgrade.cost.amount, current_level)
            cost *= (data.persist.upgrades.eternal_scaling > 0? 1 - (0.05 * data.persist.upgrades.eternal_scaling) : 1)
            cost *= (data.persist.upgrades.cascade_reaction > 0? 1 - (0.05 * Math.min(data.persist.upgrades.cascade_reaction, 5)) : 1)

            if (!can_afford_upgrade(data, upgrade.cost.currency, cost)) {
                return
            }

            if (cost > highest_cost) {
                most_expensive = { upgrade, cost, category }
                highest_cost = cost
            }
        })
    })

    return most_expensive
}

function auto_buy_upgrade(data, purchase) {
    if (!purchase) return false

    let { upgrade, cost, category } = purchase
    data.persist.currencies[upgrade.cost.currency] -= cost

    if (data.persist.upgrades[upgrade.id] != null) {
        data.persist.upgrades[upgrade.id] += 1
    } else {
        data.persist.upgrades[upgrade.id] = 1
    }

    return true
}

function is_upgrade_available(data, upgrade_data) {
    let upgrade_available = true

    if (data.persist.upgrades[upgrade_data.id] >= upgrade_data.max_level && data.persist.other.settings.hide_complete_upgrades == true) {
        upgrade_available = false
    }

    if (upgrade_data.requirements) {
        if (upgrade_data.requirements.upgrades != null) {
            upgrade_data.requirements.upgrades.forEach((value, _index, _array) => {
                if (upgrade_available == false) {
                    return
                }

                if (data.persist.upgrades[value.name] == null && value.amount != -1) {
                    upgrade_available = false
                }

                if (value.amount != null) {
                    if (value.amount >= 0) {
                        if (data.persist.upgrades[value.name] < value.amount) {
                            upgrade_available = false
                        }
                    } else {
                        if (data.persist.upgrades[value.name] >= 1) {
                            upgrade_available = false
                        }
                    }
                }
            })
        }

        if (upgrade_data.requirements.unlocks != null && upgrade_available == true) {
            upgrade_data.requirements.unlocks.forEach((value, _index, _array) => {
                if (upgrade_available == false) {
                    return
                }

                if (data.persist.unlocks[value] != true) {
                    upgrade_available = false
                }
            })
        }
    }

    return upgrade_available
}

function evaluate_upgrade_button(data, upgrade) {
    let upgrade_available = is_upgrade_available(data, upgrade.upgrade_data)

    if (upgrade_available == true) {
        upgrade.base_button.style.setProperty("display", "block")

        let upgrade_level = upgrade.base_button.children[1]

        let max_level = upgrade.upgrade_data.max_level
        let current_level = 0
        if (data.persist.upgrades[upgrade.upgrade_data.id] != null) {
            current_level = data.persist.upgrades[upgrade.upgrade_data.id]
        }
        if (current_level >= max_level) {
            upgrade.base_button.setAttribute("_maxxed", "true")
        }
        let upgrade_level_text = "(" + current_level.toString() + "/" + max_level.toString() + ")"
        if (upgrade_level.innerHTML != upgrade_level_text) {
            upgrade_level.innerHTML = upgrade_level_text
        }

        let upgrade_effect = upgrade.base_button.children[3]
        let dynamic_eval = evaluate_dynamic_amount(upgrade.upgrade_data.effect.amount, current_level)
        let upgrade_effect_text = ""
        if (typeof(dynamic_eval) == "number") {
            upgrade_effect_text = "Effect: " + upgrade.upgrade_data.effect.prefix + formatNumber(dynamic_eval) + " " + upgrade.upgrade_data.effect.suffix
        } else {
            upgrade_effect_text = "Effect: " + upgrade.upgrade_data.effect.prefix + dynamic_eval + " " + upgrade.upgrade_data.effect.suffix
        }
        if (upgrade_effect.innerHTML != upgrade_effect_text) {
            upgrade_effect.innerHTML = upgrade_effect_text
        }

        let upgrade_cost_display = upgrade.base_button.children[5]
        let upgrade_cost = evaluate_dynamic_amount(upgrade.upgrade_data.cost.amount, current_level)
        upgrade_cost *= (data.persist.upgrades.eternal_scaling > 0? 1 - (0.05 * data.persist.upgrades.eternal_scaling) : 1)
        upgrade_cost *= (data.persist.upgrades.cascade_reaction > 0? 1 - (0.05 * Math.min(data.persist.upgrades.cascade_reaction, 5)) : 1)
        upgrade.upgrade_data.name + " cost: " + formatNumber(upgrade_cost)
        let upgrade_cost_text = upgrade.upgrade_data.cost.prefix + "-" + formatNumber(upgrade_cost) + " " + upgrade.upgrade_data.cost.suffix

        if (upgrade_cost_display.innerHTML != upgrade_cost_text) {
            upgrade_cost_display.innerHTML = upgrade_cost_text
        }

        if (can_afford_upgrade(data, upgrade.upgrade_data.cost.currency, upgrade_cost) && current_level < max_level) {
            if (upgrade.base_button.getAttribute("disabled") != null) {
                upgrade.base_button.removeAttribute("disabled")
            }
        } else {
            if (upgrade.base_button.getAttribute("disabled") == null) {
                upgrade.base_button.setAttribute("disabled", "disabled")
            }
        }
    } else {
        upgrade.base_button.style.setProperty("display", "none")
    }
}

let upgrade_buttons = []

function create_upgrade_buttons(data, list, category) {
    list.forEach((value, index, _array) => {
        let return_table = {
            upgrade_data: value
        }
        return_table.base_button = document.createElement("button")
        return_table.base_button.className = "upgrade_button"
        return_table.base_button.id = category + "_" + value.id
        return_table.base_button.style.setProperty("order", index)

        let upgrade_name = document.createElement("div")
        upgrade_name.className = "upgrade_title"
        upgrade_name.innerHTML = value.name
        return_table.base_button.appendChild(upgrade_name)

        let upgrade_level = document.createElement("div")
        upgrade_level.className = "upgrade_level"

        let max_level = value.max_level
        let current_level = 0
        if (data.persist.upgrades[value.id] != null) {
            current_level = data.persist.upgrades[value.id]
        }
        upgrade_level.innerHTML = "(" + current_level.toString() + "/" + max_level.toString() + ")"
        return_table.base_button.appendChild(upgrade_level)

        let upgrade_desc = document.createElement("div")
        upgrade_desc.className = "upgrade_description"
        upgrade_desc.innerHTML = value.description
        return_table.base_button.appendChild(upgrade_desc)

        let upgrade_effect = document.createElement("div")
        upgrade_effect.className = "upgrade_effect"

        let dynamic_eval = evaluate_dynamic_amount(value.effect.amount, current_level)
        if (typeof(dynamic_eval) == "number") {
            upgrade_effect.innerHTML = "Effect: " + value.effect.prefix + dynamic_eval.toFixed(2) + " " + value.effect.suffix
        } else {
            upgrade_effect.innerHTML = "Effect: " + value.effect.prefix + dynamic_eval + " " + value.effect.suffix
        }
        return_table.base_button.appendChild(upgrade_effect)
        return_table.base_button.appendChild(document.createElement("br"))

        let upgrade_cost = document.createElement("div")
        upgrade_cost.className = "upgrade_cost"
        upgrade_cost.innerHTML = value.cost.prefix + (-evaluate_dynamic_amount(value.cost.amount, current_level)) + " " + value.cost.suffix
        return_table.base_button.appendChild(upgrade_cost)

        return_table.base_button.addEventListener("click", (_self, _event) => {
            evaluate_upgrade_button(data, return_table)
            
            let evaluate_level = 0
            if (data.persist.upgrades[value.id] != null) {
                evaluate_level = data.persist.upgrades[return_table.upgrade_data.id]
            }

            if (return_table.base_button.getAttribute("disabled") == null) {
                let cost = evaluate_dynamic_amount(return_table.upgrade_data.cost.amount, evaluate_level)
                cost *= (data.persist.upgrades.eternal_scaling > 0? 1 - (0.05 * data.persist.upgrades.eternal_scaling) : 1)
                cost *= (data.persist.upgrades.cascade_reaction > 0? 1 - (0.05 * Math.min(data.persist.upgrades.cascade_reaction, 5)) : 1)
                data.persist.currencies[return_table.upgrade_data.cost.currency] -= cost

                if (data.persist.upgrades[return_table.upgrade_data.id] != null) {
                    data.persist.upgrades[return_table.upgrade_data.id] += 1
                } else {
                    data.persist.upgrades[return_table.upgrade_data.id] = 1
                }

                let newLevel = data.persist.upgrades[return_table.upgrade_data.id]
                add_event_message(`Purchased ${return_table.upgrade_data.name} (Level ${newLevel}) for ${formatNumber(cost)} ${return_table.upgrade_data.cost.currency.replace(/_/g, " ")}`, "info")

                evaluate_upgrade_button(data, return_table)
            }
        })
        upgrade_buttons.push(return_table)
        document.getElementById("upgrade_container_" + category).appendChild(return_table.base_button)

        evaluate_upgrade_button(data, return_table)
    })

    
}

function changetab(tab_name) {
    document.querySelectorAll('button[id^=select_tab_]').forEach((tab, _index, _parent) => {
        if (tab.id.endsWith(tab_name)) {
            tab.dataset.selected = true;
        } else {
            tab.dataset.selected = false;
        }
    })

    document.querySelectorAll('div[id^=tab_]').forEach((tab, _index, _parent) => {
        if (tab.id.endsWith(tab_name)) {
            tab.style.display = "block";
        } else {
            tab.style.display = "none";
        }
    })
}

function changeupgradetab(tab_name) {
    document.querySelectorAll('button[id^=upgrade_tab_]').forEach((tab, _index, _parent) => {
        if (tab.id.endsWith(tab_name)) {
            tab.dataset.selected = true;
        } else {
            tab.dataset.selected = false;
        }
    })

    document.querySelectorAll('div[id^=upgrade_container_]').forEach((tab, _index, _parent) => {
        if (tab.id.endsWith(tab_name)) {
            tab.style.display = "flex";
        } else {
            tab.style.display = "none";
        }
    })
}

function prestige_available(data) {
    if (data.persist.unlocks.prestige != true) {
        return false
    }
    if (data.persist.other.records.floor < PRESTIGE_FLOOR) {
        return false
    }
    return true
}

function ascension_available(data) {
    if (data.persist.unlocks.ascension != true) {
        return false
    }
    if (data.persist.layers.max_floor_this_ascension < ASCENSION_FLOOR) {
        return false
    }
    return true
}

function attempt_ascension(data) {
    if (ascension_available(data) != true) {
        return
    }

    upgrades_list.basic.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    upgrades_list.combat.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    // Beyond Infinity keeps a third of each prestige upgrade's levels per level
    let prestige_kept = (data.persist.upgrades.beyond_infinity > 0? Math.min(data.persist.upgrades.beyond_infinity, 3) / 3 : 0)
    upgrades_list.prestige.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            let kept_level = Math.floor(data.persist.upgrades[value.id] * prestige_kept)
            data.persist.upgrades[value.id] = (kept_level > 0? kept_level : null)
        }
    })

    data.persist.unlocks.combat = false;
    data.persist.unlocks.extended_upgrades = false;
    data.persist.unlocks.prestige = false;
    data.persist.unlocks.ascension = true;
    data.persist.unlocks.transcendence = true;

    if (data.non_persist.run_active == true) {
        end_run(data)
    }

    data.persist.layers.ascension += 1
    data.persist.layers.prestige = 0
    let ascension_reward = calculate_ascension_reward(data)
    data.persist.currencies.ascension_points += ascension_reward

    let prestige_carryover = 0
    if (data.persist.upgrades.momentum == 1) {
        prestige_carryover = data.persist.currencies.prestige_points * 0.1
    }
    if (data.persist.prestige_points > 0) {
        data.persist.unlocks.prestige_upgrades = true;
    }
    else
    {
        data.persist.unlocks.prestige_upgrades = false;
    }
    data.persist.currencies.prestige_points = prestige_carryover

    data.persist.currencies.research = data.persist.layers.prestige * 0.5
    data.persist.other.records.floor = 0
    data.persist.layers.max_floor_this_ascension = 0

    add_event_message(`Ascended! Gained ${ascension_reward.toFixed(2)} ascension points`, "success")

    document.getElementById("floor_record_text").innerHTML = ""
    changeupgradetab("basic")
}

function transcendence_available(data) {
    if (data.persist.unlocks.transcendence != true) {
        return false
    }
    if (data.persist.layers.max_floor_this_ascension < TRANSCENDENCE_FLOOR) {
        return false
    }
    return true
}

function attempt_transcendence(data) {
    if (transcendence_available(data) != true) {
        return
    }

    upgrades_list.basic.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    upgrades_list.combat.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    upgrades_list.prestige.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    // Starting Spark keeps a third of each ascension upgrade's levels per level
    let ascension_kept = (data.persist.upgrades.starting_spark > 0? Math.min(data.persist.upgrades.starting_spark, 3) / 3 : 0)
    upgrades_list.ascension.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            let kept_level = Math.floor(data.persist.upgrades[value.id] * ascension_kept)
            data.persist.upgrades[value.id] = (kept_level > 0? kept_level : null)
        }
    })

    data.persist.unlocks.combat = false;
    data.persist.unlocks.extended_upgrades = false;
    data.persist.unlocks.prestige = false;
    data.persist.unlocks.ascension = false;
    data.persist.unlocks.prestige_upgrades = false;
    data.persist.unlocks.transcendence = true;

    if (data.non_persist.run_active == true) {
        end_run(data)
    }

    // Calculate before resetting layers, since the reward depends on ascension count and max floor
    let transcendence_reward = calculate_transcendence_reward(data)
    data.persist.currencies.transcendence_points += transcendence_reward

    data.persist.layers.transcendence += 1
    data.persist.layers.ascension = 0
    data.persist.layers.prestige = 0


    data.persist.currencies.ascension_points = 0
    data.persist.currencies.prestige_points = 0
    data.persist.currencies.research = 0
    data.persist.other.records.floor = 0
    data.persist.layers.max_floor_this_ascension = 0

    add_event_message(`Transcended! Gained ${transcendence_reward.toFixed(2)} transcendence points`, "success")

    document.getElementById("floor_record_text").innerHTML = ""
    changeupgradetab("basic")
}

function remove_enemy(data, tile) {
    let found_index = data.non_persist.run.enemies.findIndex((enemy) => {
        return enemy.tile == tile
    })

    if (found_index != null) {
        let found_enemy = data.non_persist.run.enemies[found_index]
        found_enemy.element.remove()

        data.non_persist.run.enemies.splice(found_index, 1)
    }
}

function clear_enemies(data) {
    data.non_persist.run.enemies.forEach((value, index, _array) => {
        value.element.remove()
    })
    data.non_persist.run.enemies = []
}

function append_enemy(data, position, health, attack, defense, speed, graphic) {
    let enemy_table = {
        tile: position,
        action_tick: 0,
        stats: {
            health: health,
            max_health: health,
            attack: attack,
            defense: defense,
            speed: speed
        }
    }

    enemy_table.element = document.createElement("span")
    enemy_table.element.setAttribute("class", "dungeon_entity_icon")
    enemy_table.element.style.setProperty("--progress", position.toString())
    enemy_table.element.style.setProperty("--offset", "0px")

    let enemy_graphic = document.createElement("img")
    enemy_graphic.src = graphic
    enemy_table.element.appendChild(enemy_graphic)

    document.getElementById("enemy_container").appendChild(enemy_table.element)
    data.non_persist.run.enemies.push(enemy_table)
}

let event_log = []
const MAX_LOG_ENTRIES = 50

function add_event_message(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    event_log.unshift({ message, type, timestamp });

    if (event_log.length > MAX_LOG_ENTRIES) {
        event_log.pop();
    }

    const log_container = document.getElementById("event_log_messages");
    const message_element = document.createElement("div");
    message_element.className = `event_message ${type}`;
    message_element.innerHTML = `${message}<span class="event_timestamp">${timestamp}</span>`;

    log_container.insertBefore(message_element, log_container.firstChild);

    // Remove old messages if too many
    while (log_container.children.length > MAX_LOG_ENTRIES) {
        log_container.removeChild(log_container.lastChild);
    }
}

// Snap skips the CSS slide, so moving back to the start of the strip doesn't animate across it
function set_player_progress(progress, snap) {
    let player_icon = document.getElementById("run_player_icon")
    if (snap) {
        player_icon.style.transition = "none"
    }
    player_icon.style.setProperty("--progress", progress)
    if (snap) {
        void player_icon.offsetWidth // force reflow so the jump applies without animating
        player_icon.style.transition = ""
    }
}

let last_game_tick = 0
function start_run(data) {
    data.persist.other.runs_started += 1
    calculate_player_stats(data)

    data.non_persist.run.enemy = null
    data.non_persist.run.enemy_kills = 0
    data.non_persist.run.in_combat = false
    data.non_persist.run.move_tick = 0
    data.non_persist.run.floor = 1
    data.non_persist.run.progress = 0
    last_game_tick = 0

    set_player_progress(data.non_persist.run.progress, true)

    document.getElementById("floor_record_text").style.display = "none"
    document.getElementById("active_run_container").style.display = "block"
    data.non_persist.run_active = true

    add_event_message("Delved into the caverns", "success")
}

function end_run(data) {
    data.non_persist.run_active = false
    data.non_persist.run.in_combat = false
    data.non_persist.run.enemy = null
    
    clear_enemies(data)

    if (data.non_persist.run.floor > data.persist.other.records.floor) {
        data.persist.other.records.floor = data.non_persist.run.floor
        document.getElementById("floor_record_text").innerHTML = "Your furthest floor is Floor " + data.persist.other.records.floor.toString() + "!"
    }
    document.getElementById("floor_record_text").style.display = "block"

    if (data.persist.unlocks.upgrades != true) {
        data.persist.unlocks.upgrades = true
    }

    data.persist.currencies.research += calculate_research_gain(data)

    document.getElementById("enemy_stats_container").style.display = "none"
    document.getElementById("active_run_container").style.display = "none"
    document.getElementById("start_run_button").removeAttribute("disabled")
}

// Moves the player one tile, handling new floors and enemy encounters. Returns true if a new floor was entered.
function advance_tile(data) {
    let run = data.non_persist.run
    let wrapped_floor = false

    run.progress += 1
    if (run.progress >= 10) {
        run.progress -= 10
        run.floor += 1
        wrapped_floor = true
        data.persist.layers.max_floor_this_ascension = Math.max(data.persist.layers.max_floor_this_ascension, run.floor)

        if (is_log_milestone_floor(run.floor)) {
            add_event_message(`Entered Floor ${run.floor}`, "success")
        }

        // Second Wind
        if (data.persist.upgrades.second_wind > 0) {
            let stats = run.character_stats
            stats.courage = Math.min(stats.courage + stats.max_courage * 0.02 * data.persist.upgrades.second_wind, stats.max_courage)
        }

        if (run.floor > 2 || data.non_persist.prestige_points > 0) {
            if (data.persist.unlocks.extended_upgrades != true) {
                data.persist.unlocks.extended_upgrades = true
            }
            if (data.persist.unlocks.prestige != true) {
                data.persist.unlocks.prestige = true
            }
        }

        let enemy_stats = calculate_enemy_stats(run.floor)
        append_enemy(data, 1, enemy_stats.health, enemy_stats.attack, enemy_stats.defense, enemy_stats.speed, enemy_graphic_order[(run.floor - 1) % enemy_graphic_order.length])
    }

    let encountered = run.enemies.find((enemy) => enemy.tile == run.progress)
    if (encountered != null) {
        run.enemy = encountered
        if (data.persist.unlocks.combat != true) {
            data.persist.unlocks.combat = true
        }

        // First strike: enemies that die to one hit don't stop you
        player_attack_enemy(data)
        if (encountered.stats.health <= 0) {
            defeat_enemy(data, true)
        } else {
            run.in_combat = true
            run.attack_tick = 0
            if (is_log_milestone_floor(run.floor)) {
                add_event_message("Encountered an enemy!", "warning")
            }
        }
    }

    return wrapped_floor
}

// Applies a courage change and returns true if courage ran out
function change_courage(data, amount) {
    let stats = data.non_persist.run.character_stats
    stats.courage = Math.min(Math.max(stats.courage + amount, 0), stats.max_courage)
    return stats.courage <= 0
}

// Log every floor up to 10, then every 10th floor up to 100, every 100th up to 1000, and so on
function is_log_milestone_floor(floor) {
    if (floor <= 10) {
        return true
    }
    let step = Math.pow(10, Math.floor(Math.log10(floor)))
    return floor % step == 0
}

function player_attack_enemy(data) {
    // Critical Strike
    let attack_damage = calculate_attack(data) * (Math.random() < calculate_crit_chance(data)? 2 : 1)
    data.non_persist.run.enemy.stats.health -= calculate_damage_taken(attack_damage, data.non_persist.run.enemy.stats.defense)
}

// Quiet kills (first strike) skip the log message so fast runs don't flood the event log
function defeat_enemy(data, quiet) {
    document.getElementById("enemy_stats_container").style.display = "none"

    data.non_persist.run.enemy_kills += 1

    let stats = data.non_persist.run.character_stats
    // Trophy Hunter adds to the base 5% courage per kill
    let kill_courage = 0.05 + (data.persist.upgrades.trophy_hunter > 0? 0.01 * data.persist.upgrades.trophy_hunter : 0)
    let courage_gained = Math.min(stats.max_courage * kill_courage, stats.max_courage - stats.courage)
    stats.courage += courage_gained

    // Bloodlust
    if (data.persist.upgrades.bloodlust > 0) {
        stats.health = Math.min(stats.health + stats.max_health * 0.03 * data.persist.upgrades.bloodlust, stats.max_health)
    }

    if (!quiet) {
        add_event_message(`Defeated an enemy! (${data.non_persist.run.enemy_kills} kills) +${formatNumber(courage_gained)} Courage`, "success")
    }

    data.non_persist.run.in_combat = false
    remove_enemy(data, data.non_persist.run.enemy.tile)
    data.non_persist.run.enemy = null
}

function game_tick(data) {
    let time_elapsed = (Date.now() - last_date) / 1000
    last_date = Date.now()

    reset_chances = Math.min(reset_chances + time_elapsed, 10)
    document.getElementById("reset_data_button").innerHTML = "Reset Data (" + reset_chances.toFixed(0).toString() + ")"

    last_save += time_elapsed
    data.persist.other.time_played = data.persist.other.time_played + time_elapsed;

    if (last_save > 15) {
        last_save -= 15
        localStorage.setItem("save_data", JSON.stringify(data.persist))
    }

    // Passive currency generation
    // Cosmic Engine: 0.1% of prestige points per second
    if (data.non_persist.run_active && data.persist.upgrades.cosmic_engine == 1 && data.persist.currencies.prestige_points > 0) {
        data.persist.currencies.prestige_points += data.persist.currencies.prestige_points * 0.001 * time_elapsed
    }

    // Dimensional Echo: +0.05% research per second per level (max 5), only while in a run
    if (data.non_persist.run_active && data.persist.upgrades.dimensional_echo > 0 && data.persist.currencies.research > 0 && data.persist.currencies.research < 1e100) {
        let echo_multiplier = Math.min(data.persist.upgrades.dimensional_echo, 5) * 0.0005
        data.persist.currencies.research += data.persist.currencies.research * echo_multiplier * time_elapsed
    }

    // Auto Shop: automatically buy cheapest available upgrade
    if (data.persist.upgrades.auto_shop == 1) {
        let cheapest_purchase = find_cheapest_upgrade(data, ["basic", "combat"])
        let success = auto_buy_upgrade(data, cheapest_purchase)
        if (success && cheapest_purchase) {
            let newLevel = data.persist.upgrades[cheapest_purchase.upgrade.id]
            add_event_message(`Auto-purchased ${cheapest_purchase.upgrade.name} (Level ${newLevel}) for ${formatNumber(cheapest_purchase.cost)} ${cheapest_purchase.upgrade.cost.currency.replace(/_/g, " ")}`, "info")
        }
    }

    if (data.non_persist.run_active == true) {
        last_game_tick += time_elapsed
        if (last_game_tick > 0.016) {
            while (last_game_tick > 0.016 && data.non_persist.run_active == true) {
                last_game_tick -= 0.016

                document.getElementById("start_run_button").setAttribute("disabled", "disabled")

                let current_health_change = calculate_health_change(data)
                data.non_persist.run.character_stats.health = Math.min(Math.max(data.non_persist.run.character_stats.health + current_health_change / 60, 0), data.non_persist.run.character_stats.max_health)

                if (data.non_persist.run.character_stats.health <= 0) {
                    add_event_message("Health depleted... Fled the caverns", "danger")
                    end_run(data)
                    break
                }

                // Step through this frame event by event (next tile, next hit, next enemy attack),
                // so very high move and attack speeds stay accurate and can clear several floors per frame.
                let wrapped_floor = false
                let moved = false
                let run_over = false
                let time_left = 1 / 60
                while (time_left > 1e-9 && run_over == false) {
                    let run = data.non_persist.run

                    if (run.in_combat == false) {
                        let speed = calculate_move_speed(data)
                        let step = Math.min(time_left, (1 - run.move_tick) / speed)
                        time_left -= step

                        if (change_courage(data, calculate_courage_change(data) * step)) {
                            add_event_message("Ran out of courage... Fled the caverns", "danger")
                            run_over = true
                            break
                        }

                        run.move_tick += speed * step
                        if (run.move_tick < 1 - 1e-9) {
                            continue
                        }
                        run.move_tick = 0
                        moved = true
                        wrapped_floor = advance_tile(data) || wrapped_floor
                    } else {
                        let enemy = run.enemy
                        let attack_speed = calculate_attack_speed(data)
                        let step = Math.min(time_left, (1 - run.attack_tick) / attack_speed, (1 - enemy.action_tick) / enemy.stats.speed)
                        time_left -= step

                        // No drain in combat, but courage regen still applies
                        change_courage(data, calculate_courage_change(data) * step)

                        run.attack_tick += attack_speed * step
                        enemy.action_tick += enemy.stats.speed * step

                        if (enemy.action_tick >= 1 - 1e-9) {
                            enemy.action_tick = 0
                            run.character_stats.health -= calculate_damage_taken(enemy.stats.attack, calculate_defense(data))
                            if (run.character_stats.health <= 0) {
                                add_event_message("Health depleted... Fled the caverns", "danger")
                                run_over = true
                                break
                            }
                        }

                        if (run.attack_tick >= 1 - 1e-9) {
                            run.attack_tick = 0
                            player_attack_enemy(data)
                            if (enemy.stats.health <= 0) {
                                defeat_enemy(data, !is_log_milestone_floor(run.floor))
                            }
                        }
                    }
                }
                if (moved) {
                    set_player_progress(data.non_persist.run.progress, wrapped_floor)
                }

                if (run_over) {
                    end_run(data)
                    break
                }

                if (data.non_persist.run.in_combat) {
                    data.non_persist.run.enemy.element.style.setProperty("--offset", "16px")
                    document.getElementById("run_player_icon").style.setProperty("--offset", "-16px")
                } else {
                    document.getElementById("run_player_icon").style.setProperty("--offset", "0px")
                }
            
            
                document.getElementById("active_run_info").innerHTML = "Floor " + data.non_persist.run.floor.toString() + " - " + data.non_persist.run.progress.toString() + "/10"
            }
        }
    } else {
        calculate_player_stats(data)

        if (data.persist.upgrades.auto_delve == 1) {
            start_run(data)
        }
    }
}

function format_stat_value(num) {
    if (num != 0 && Math.abs(num) < 0.01) {
        return num.toPrecision(3)
    }
    return formatNumber(num)
}

function update_upgrade_stats_panel(data) {
    let stats = calculate_upgrade_stats(data)
    let stats_html = ""

    if (stats.length == 0) {
        stats_html = '<div class="upgrade_stat_empty">No upgrades yet</div>'
    }

    stats.forEach((stat) => {
        stats_html += '<div class="upgrade_stat_row"><span class="upgrade_stat_label">' + stat.label + '</span><span class="upgrade_stat_value">' + stat.prefix + format_stat_value(stat.value) + stat.suffix + '</span></div>'
    })

    let stats_list = document.getElementById("upgrade_stats_list")
    if (stats_list.innerHTML != stats_html) {
        stats_list.innerHTML = stats_html
    }
}

function display_tick(data) {
    upgrade_buttons.forEach((value, _index, _array) => {
        evaluate_upgrade_button(data, value)
    })

    update_upgrade_stats_panel(data)

    document.getElementById("font_switcher").innerHTML = (data.persist.other.settings.cool_font == true? "Charm (Default)" : "Monospace")
    document.getElementById("hide_upgrade_switch").innerHTML = (data.persist.other.settings.hide_complete_upgrades == true? "Yes" : "No")

    if (data.persist.other.settings.cool_font) {
        document.getElementById("main-style").innerHTML = "* {font-family: 'Charm'};"
    } else {
        document.getElementById("main-style").innerHTML = "* {font-family: 'Lucida Console'};"
    }

    document.getElementById("last_save_display").innerHTML = "Last saved " + last_save.toFixed(1).toString() + "s ago."

    document.getElementById("select_tab_prestige").style.display = (data.persist.unlocks.prestige == true? "block" : "none");

    document.getElementById("select_tab_upgrades").style.display = (data.persist.unlocks.upgrades == true? "block" : "none");

    document.getElementById("select_tab_ascension").style.display = (data.persist.unlocks.ascension == true? "block" : "none");

    document.getElementById("select_tab_transcendence").style.display = (data.persist.unlocks.transcendence == true? "block" : "none");

    document.getElementById("ascend_button").style.display = (data.persist.unlocks.ascension == true? "block" : "none");
    document.getElementById("ascension_counter").style.display = (data.persist.unlocks.ascension == true? "block" : "none");
    document.getElementById("ascension_point_display").style.display = (data.persist.unlocks.ascension == true? "block" : "none");

    document.getElementById("transcend_button").style.display = (data.persist.unlocks.transcendence == true? "block" : "none");
    document.getElementById("transcendence_counter").style.display = (data.persist.unlocks.transcendence == true? "block" : "none");
    document.getElementById("transcendence_point_display").style.display = (data.persist.unlocks.transcendence == true? "block" : "none");

    document.getElementById("upgrade_tab_prestige").style.display = (data.persist.unlocks.prestige_upgrades == true? "block" : "none");
    document.getElementById("upgrade_tab_combat").style.display = (data.persist.unlocks.combat == true? "block" : "none");
    document.getElementById("upgrade_tab_ascension").style.display = (data.persist.unlocks.ascension == true? "block" : "none");
    document.getElementById("upgrade_tab_transcendence").style.display = (data.persist.unlocks.transcendence == true? "block" : "none");

    document.getElementById("player_stats_container").style.display = (data.persist.other.runs_started > 0? "inline-block" : "none");

    if (data.persist.unlocks.prestige_upgrades == true) {
        document.getElementById("prestige_point_display").innerHTML = "Prestige Points: " + formatNumber(data.persist.currencies.prestige_points)
    }

    if (data.persist.unlocks.prestige == true) {
        document.getElementById("prestige_counter").innerHTML = "Prestige " + (data.persist.layers.prestige > 0? data.persist.layers.prestige : 0).toString()

        let prestige_button = document.getElementById("prestige_button")

        if (prestige_available(data)) {
            prestige_button.innerHTML = "+" + formatNumber(calculate_prestige_reward(data)) + " Prestige Points"
            prestige_button.removeAttribute("disabled");
        } else {
            prestige_button.innerHTML = "Reach Floor " + PRESTIGE_FLOOR + " to Prestige"
            prestige_button.setAttribute("disabled", "hi");
        }
    }

    if (data.persist.unlocks.ascension == true) {
        document.getElementById("ascension_counter").innerHTML = "Ascensions: " + (data.persist.layers.ascension > 0? data.persist.layers.ascension : 0).toString()
        document.getElementById("ascension_point_display").innerHTML = "Ascension Points: " + formatNumber(data.persist.currencies.ascension_points)

        let ascend_button = document.getElementById("ascend_button")
        let ascension_reward = calculate_ascension_reward(data) || 0

        let reward_preview_text = "You will gain " + formatNumber(ascension_reward) + " Ascension Points (Furthest floor this ascension: " + (data.persist.layers.max_floor_this_ascension || 0) + ")"
        if (ascension_reward <= 0) {
            reward_preview_text += " (reach floor " + ASCENSION_FLOOR + " to ascend)"
        }
        document.getElementById("ascension_reward_preview").innerHTML = reward_preview_text

        if (ascension_available(data)) {
            ascend_button.innerHTML = "Ascend for +" + formatNumber(ascension_reward) + " Ascension Points"
            ascend_button.removeAttribute("disabled");
        } else {
            ascend_button.innerHTML = "Reach Floor " + ASCENSION_FLOOR + " to Ascend"
            ascend_button.setAttribute("disabled", "hi");
        }
    }

    if (data.persist.unlocks.transcendence == true) {
        document.getElementById("transcendence_counter").innerHTML = "Transcendences: " + (data.persist.layers.transcendence > 0? data.persist.layers.transcendence : 0).toString()
        document.getElementById("transcendence_point_display").innerHTML = "Transcendence Points: " + formatNumber(data.persist.currencies.transcendence_points)

        let transcend_button = document.getElementById("transcend_button")
        let transcendence_reward = calculate_transcendence_reward(data)

        document.getElementById("transcendence_reward_preview").innerHTML = "You will gain " + formatNumber(transcendence_reward) + " Transcendence Points (Furthest floor this ascension: " + (data.persist.layers.max_floor_this_ascension || 0) + ")"

        if (transcendence_available(data)) {
            transcend_button.innerHTML = "Transcend for +" + formatNumber(transcendence_reward) + " Transcendence Points"
            transcend_button.removeAttribute("disabled");
        } else {
            let floor_needed = Math.max(0, TRANSCENDENCE_FLOOR - data.persist.layers.max_floor_this_ascension)
            transcend_button.innerHTML = "Reach Floor " + TRANSCENDENCE_FLOOR + " to Transcend (" + floor_needed + " more)"
            transcend_button.setAttribute("disabled", "hi");
        }
    }

    if (data.persist.unlocks.upgrades) {
        document.getElementById("research_display").innerHTML = "Research: " + formatNumber(data.persist.currencies.research)
        document.getElementById("currency_display").style.height = "24px";
    } else {
        document.getElementById("currency_display").style.height = "0px";
    }

    document.getElementById("health_bar").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_attack").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_defense").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_attack_speed").style.display = (data.persist.unlocks.combat? "block" : "none");

    document.getElementById("player_attack").innerHTML = "Attack: " + formatNumber(calculate_attack(data))
    document.getElementById("player_defense").innerHTML = "Defense: " + formatNumber(calculate_defense(data))
    document.getElementById("player_attack_speed").innerHTML = "Attack Speed: " + formatNumber(calculate_attack_speed(data)) + "x"
    document.getElementById("player_speed").innerHTML = "Move Speed: " + formatNumber(calculate_move_speed(data)) + "x"

    document.querySelector("#courage_bar > .bar_text").innerHTML = "Courage: " + formatNumber(data.non_persist.run.character_stats.courage)  + "/" + formatNumber(data.non_persist.run.character_stats.max_courage)
    if (data.non_persist.run_active) {
        let research_gain = calculate_research_gain(data)
        document.getElementById("research_display").innerHTML = "Research: " + formatNumber(data.persist.currencies.research) + " (+" + formatNumber(research_gain) + ")"

        let current_courage_loss = calculate_courage_change(data)

        document.querySelector("#courage_bar > .bar_text").innerHTML = "Courage: " + formatNumber(data.non_persist.run.character_stats.courage)  + "/" + formatNumber(data.non_persist.run.character_stats.max_courage) + " (" + formatNumber(current_courage_loss) + "/s)"
    }
    
    document.querySelector("#courage_bar > .fill_bar").style.setProperty("--percent", data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage)

    document.querySelector("#health_bar > .bar_text").innerHTML = "Health: " + formatNumber(data.non_persist.run.character_stats.health)  + "/" + formatNumber(data.non_persist.run.character_stats.max_health)
    document.querySelector("#health_bar > .fill_bar").style.setProperty("--percent", data.non_persist.run.character_stats.health / data.non_persist.run.character_stats.max_health)

    document.getElementById("enemy_stats_container").style.display = (data.non_persist.run.in_combat? "inline-block" : "none");
    if (data.non_persist.run.enemy) {
        document.getElementById("enemy_attack").innerHTML = "Attack: " + formatNumber(data.non_persist.run.enemy.stats.attack)
        document.getElementById("enemy_defense").innerHTML = "Defense: " + formatNumber(data.non_persist.run.enemy.stats.defense)
        document.getElementById("enemy_speed").innerHTML = "Attack Speed: " + formatNumber(data.non_persist.run.enemy.stats.speed) + "x"

        document.querySelector("#enemy_health_bar > .bar_text").innerHTML = "Health: " + formatNumber(data.non_persist.run.enemy.stats.health)  + "/" + formatNumber(data.non_persist.run.enemy.stats.max_health)
        document.querySelector("#enemy_health_bar > .fill_bar").style.setProperty("--percent", data.non_persist.run.enemy.stats.health / data.non_persist.run.enemy.stats.max_health)
    }
}

function attempt_prestige(data) {
    if (prestige_available(data) != true) {
        return
    }

    upgrades_list.basic.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    upgrades_list.combat.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    data.persist.unlocks.combat = false;
    data.persist.unlocks.extended_upgrades = false;
    data.persist.unlocks.prestige_upgrades = true

    if (data.non_persist.run_active == true) {
        end_run(data)
    }

    data.persist.layers.prestige += 1
    let prestige_reward = calculate_prestige_reward(data)
    data.persist.currencies.prestige_points += prestige_reward
    data.persist.currencies.research = data.persist.layers.prestige * 0.5
    // Head Start
    data.persist.currencies.research += (data.persist.upgrades.head_start > 0? 25 * data.persist.upgrades.head_start : 0)
    data.persist.other.records.floor = 0

    add_event_message(`Prestiged! Gained ${prestige_reward.toFixed(2)} prestige points`, "success")

    // Unlock ascension after first prestige
    if (data.persist.layers.prestige >= 1 && data.persist.unlocks.ascension != true) {
        data.persist.unlocks.ascension = true
    }

    document.getElementById("floor_record_text").innerHTML = ""
    changeupgradetab("basic")
}



function start() {
    let data = load_data()

    create_upgrade_buttons(data, upgrades_list.basic, "basic")
    create_upgrade_buttons(data, upgrades_list.combat, "combat")
    create_upgrade_buttons(data, upgrades_list.prestige, "prestige")
    create_upgrade_buttons(data, upgrades_list.ascension, "ascension")
    create_upgrade_buttons(data, upgrades_list.transcendence, "transcendence")

    if (data.persist.unlocks.upgrades == true) {
        document.getElementById("select_tab_upgrades").style.display = "block";
    }

    if (data.persist.unlocks.combat == true) {
        document.getElementById("upgrade_tab_combat").style.display = "block";
    }

    if (data.persist.unlocks.ascension == true) {
        document.getElementById("upgrade_tab_ascension").style.display = "block";
        document.getElementById("select_tab_ascension").style.display = "block";
        document.getElementById("ascend_button").style.display = "block";
        document.getElementById("ascension_counter").style.display = "block";
        document.getElementById("ascension_point_display").style.display = "block";
    }

    if (data.persist.unlocks.transcendence == true) {
        document.getElementById("upgrade_tab_transcendence").style.display = "block";
        document.getElementById("select_tab_transcendence").style.display = "block";
        document.getElementById("transcendence_point_display").style.display = "block";
    }

    if (data.persist.other.records.floor > 0) {
        document.getElementById("floor_record_text").innerHTML = "Your furthest floor is Floor " + data.persist.other.records.floor.toString() + "!"
    }

    document.getElementById("start_run_button").addEventListener("click", (_self, _event) => {
        if (data.non_persist.run_active == false) {
            start_run(data)
        }
    })

     document.getElementById("reset_data_button").addEventListener("click", (_self, _event) => {
        reset_chances -= 1
        if (reset_chances < 1) {
            reset_chances = 10

            end_run(data)
            localStorage.removeItem("save_data")
            window.location.reload()
        }
    })

    let save_text = document.getElementById("save_data_text")

    document.getElementById("export_save_button").addEventListener("click", (_self, _event) => {
        save_text.value = encode_save(data.persist)
        save_text.select()
        set_save_transfer_status("Save code exported. Copy it from the box above.", false)
        navigator.clipboard?.writeText(save_text.value).then(
            () => set_save_transfer_status("Save code copied to clipboard.", false),
            () => set_save_transfer_status("Save code exported. Copy it from the box above.", false)
        )
    })

    document.getElementById("download_save_button").addEventListener("click", (_self, _event) => {
        let blob = new Blob([encode_save(data.persist)], { type: "text/plain" })
        let link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "ccl_save_" + new Date().toISOString().slice(0, 10) + ".txt"
        link.click()
        URL.revokeObjectURL(link.href)
        set_save_transfer_status("Save file downloaded.", false)
    })

    document.getElementById("import_save_button").addEventListener("click", (_self, _event) => {
        import_save(save_text.value)
    })

    let file_input = document.getElementById("save_file_input")

    document.getElementById("upload_save_button").addEventListener("click", (_self, _event) => {
        file_input.click()
    })

    file_input.addEventListener("change", async (_event) => {
        let file = file_input.files[0]
        file_input.value = ""
        if (file) {
            import_save(await file.text())
        }
    })

    document.getElementById("prestige_button").addEventListener("click", (_self, _event) => {
        attempt_prestige(data)
    })

    document.getElementById("ascend_button").addEventListener("click", (_self, _event) => {
        attempt_ascension(data)
    })

    document.getElementById("transcend_button").addEventListener("click", (_self, _event) => {
        attempt_transcendence(data)
    })

    document.getElementById("font_switcher").addEventListener("click", (_self, _event) => {
        data.persist.other.settings.cool_font = !data.persist.other.settings.cool_font
    })

    document.getElementById("hide_upgrade_switch").addEventListener("click", (_self, _event) => {
        data.persist.other.settings.hide_complete_upgrades = !data.persist.other.settings.hide_complete_upgrades
    })

    changetab("main")
    changeupgradetab("basic")

    setInterval(game_tick, 1000/60, data)
    setInterval(display_tick, 1000/20, data)
}

onload = start