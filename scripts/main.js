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
                ascension: 0
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

    return base_data
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
            description: "Make your torch shine even brighter than before.. Slows down courage loss multiplicatively.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.1,
                },
                prefix: "-",
                suffix: " x Courage Loss/s"
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

            max_level: 9
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

            max_level: 30
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
                    value: 0.2,
                },
                prefix: "+",
                suffix: "Move Speed"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 1,
                    multiplier: 1.25
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

            max_level: 15
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
                    multiplier: 1.75
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
                    type: "multiply_effect",
                    value: 0.8,
                    multiplier: 0.8
                },
                prefix: "",
                suffix: "x Courage Loss"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 20,
                    multiplier: 1.25
                },
                prefix: "",
                suffix: "Research"
            },
            
            requirements: {
                unlocks: [
                    "extended_upgrades"
                ]
            },

            max_level: 50
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
                    value: 1,
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

            max_level: 75
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

            max_level: 75
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
            description: "Work on making your blade the best it can be. Further increases attack power.",
            effect: {
                amount: {
                    type: "multiply_effect",
                    value: 2,
                    multiplier: 1.25
                },
                prefix: "+",
                suffix: "Attack"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 100,
                    multiplier: 1.5
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

            max_level: 50
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
                    multiplier: 1.5
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
            description: "Toughen up your armor. Further increases defense.",
            effect: {
                amount: {
                    type: "increment",
                    value: 2
                },
                prefix: "+",
                suffix: "Defense"
            },

            cost: {
                currency: "research",
                amount: {
                    type: "multiply",
                    value: 600,
                    multiplier: 1.75
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

            max_level: 50
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
                    multiplier: 1.5
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
                    multiplier: 1.5
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

            max_level: 30
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
                    multiplier: 1.5
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
                    multiplier: 1.5
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
    ],
    prestige: [
        {
            id: "prestige_research",
            name: "P-Research",
            description: "Gain significantly more research.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.5,
                },
                prefix: "+",
                suffix: "x Research"
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

            max_level: 30
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

            max_level: 30
        },
        {
            id: "prestige_courage_loss",
            name: "P-Courage Retention",
            description: "Lose courage significantly slower.",
            effect: {
                amount: {
                    type: "multiply_effect",
                    value: 0.875,
                    multiplier: 0.875
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

            max_level: 30
        },
        {
            id: "prestige_health",
            name: "P-Health",
            description: "Gain exponentially more health.",
            effect: {
                amount: {
                    type: "multiply_effect",
                    value: 2,
                    multiplier: 1.625
                },
                prefix: "+",
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

            max_level: 30
        },
        {
            id: "prestige_defense",
            name: "P-Defense",
            description: "Gain more defense.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1
                },
                prefix: "+",
                suffix: " Defense"
            },

            cost: {
                currency: "prestige_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Prestige Points"
            },

            requirements: {
                unlocks: [
                    "prestige_upgrades"
                ]
            },

            max_level: 30
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
    ],
    ascension: [
        {
            id: "infinite_loop",
            name: "Infinite Loop",
            description: "Unlock the ability to ascend multiple times.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "Multiple Ascensions",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "flat_constant",
                    value: 1
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 1
        },
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
                    type: "multiply_effect",
                    value: 1.5,
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
            id: "transcendent_research",
            name: "Transcendent Research",
            description: "Gain more research based on ascension count.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.5,
                },
                prefix: "+",
                suffix: "x Research (per ascension)"
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
            id: "transcendent_courage",
            name: "Transcendent Courage",
            description: "Gain more max courage based on ascension count.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.5,
                },
                prefix: "+",
                suffix: "Courage (per ascension)"
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
            id: "transcendent_health",
            name: "Transcendent Health",
            description: "Gain more max health based on ascension count.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Health (per ascension)"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 10
        },
        {
            id: "transcendent_defense",
            name: "Transcendent Defense",
            description: "Gain more defense based on ascension count.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.5,
                },
                prefix: "+",
                suffix: "Defense (per ascension)"
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
            id: "infinite_prestige_layers",
            name: "Infinite Prestige Layers",
            description: "Extend how deep you can prestige within each ascension.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Max Prestige Layers"
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "multiply",
                    value: 3,
                    multiplier: 2
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            max_level: 3
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
            id: "breach_ceiling",
            name: "Breach the Ceiling",
            description: "Unlock the Transcendence upgrades category.",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "Unlock Transcendence",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "ascension_points",
                amount: {
                    type: "flat_constant",
                    value: 10
                },
                prefix: "",
                suffix: "Ascension Points"
            },

            requirements: {
                unlocks: [
                    "transcendence"
                ]
            },

            max_level: 1
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
                    multiplier: 1.5
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
                    value: 0.05,
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
            id: "courage_nexus",
            name: "Courage Nexus",
            description: "Courage never fully depletes (quality of life).",
            effect: {
                amount: {
                    type: "flat_constant",
                    value: "Courage Floor: 0.01",
                },
                prefix: "",
                suffix: ""
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "flat_constant",
                    value: 5
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 1
        },
        {
            id: "perfect_equilibrium",
            name: "Perfect Equilibrium",
            description: "Reduce all stat losses.",
            effect: {
                amount: {
                    type: "increment",
                    value: 0.02,
                },
                prefix: "-",
                suffix: "x Stat Loss"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 2,
                    multiplier: 1.5
                },
                prefix: "",
                suffix: "Transcendence Points"
            },

            max_level: 10
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
            description: "Allow ascending even after reaching the prestige cap.",
            effect: {
                amount: {
                    type: "increment",
                    value: 1,
                },
                prefix: "+",
                suffix: "Max Ascensions"
            },

            cost: {
                currency: "transcendence_points",
                amount: {
                    type: "multiply",
                    value: 10,
                    multiplier: 2
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
            upgrade_effect_text = "Effect: " + upgrade.upgrade_data.effect.prefix + dynamic_eval.toFixed(2) + " " + upgrade.upgrade_data.effect.suffix
        } else {
            upgrade_effect_text = "Effect: " + upgrade.upgrade_data.effect.prefix + dynamic_eval + " " + upgrade.upgrade_data.effect.suffix
        }
        if (upgrade_effect.innerHTML != upgrade_effect_text) {
            upgrade_effect.innerHTML = upgrade_effect_text
        }

        let upgrade_cost_display = upgrade.base_button.children[5]
        let upgrade_cost = evaluate_dynamic_amount(upgrade.upgrade_data.cost.amount, current_level)
        upgrade_cost *= (data.persist.upgrades.eternal_scaling > 0? 1 - (0.05 * data.persist.upgrades.eternal_scaling) : 1)
        upgrade_cost = upgrade_cost.toFixed(2)
        let upgrade_cost_text = upgrade.upgrade_data.cost.prefix + (-upgrade_cost) + " " + upgrade.upgrade_data.cost.suffix

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
        upgrade_cost.innerHTML = value.cost.prefix + (-evaluate_dynamic_amount(value.cost.amount, current_level).toFixed(2)) + " " + value.cost.suffix
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
                data.persist.currencies[return_table.upgrade_data.cost.currency] -= cost

                if (data.persist.upgrades[return_table.upgrade_data.id] != null) {
                    data.persist.upgrades[return_table.upgrade_data.id] += 1
                } else {
                    data.persist.upgrades[return_table.upgrade_data.id] = 1
                }

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
    if (data.persist.other.records.floor < 6) {
        return false
    }
    return true
}

function ascension_available(data) {
    if (data.persist.unlocks.ascension != true) {
        return false
    }
    if (data.persist.currencies.prestige_points < 10) {
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

    upgrades_list.prestige.forEach((value, _index, _array) => {
        if (data.persist.upgrades[value.id] != null) {
            data.persist.upgrades[value.id] = null
        }
    })

    data.persist.unlocks.combat = false;
    data.persist.unlocks.extended_upgrades = false;
    data.persist.unlocks.prestige = false;
    data.persist.unlocks.prestige_upgrades = false;
    data.persist.unlocks.ascension = true;

    if (data.non_persist.run_active == true) {
        end_run(data)
    }

    data.persist.layers.ascension += 1
    data.persist.layers.prestige = 0
    data.persist.currencies.ascension_points += calculate_ascension_reward(data)
    data.persist.currencies.research = data.persist.layers.prestige * 0.5
    data.persist.other.records.floor = 0

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

    document.getElementById("run_player_icon").style.setProperty("--progress", data.non_persist.run.progress)

    document.getElementById("floor_record_text").style.display = "none"
    document.getElementById("active_run_container").style.display = "block"
    data.non_persist.run_active = true
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
    if (data.persist.upgrades.cosmic_engine == 1 && data.persist.currencies.prestige_points > 0) {
        data.persist.currencies.transcendence_points += data.persist.currencies.prestige_points * 0.001 * time_elapsed
    }

    // Auto Shop: automatically buy cheapest available upgrade
    if (data.persist.upgrades.auto_shop == 1) {
        let cheapest_purchase = find_cheapest_upgrade(data, ["basic", "combat"])
        auto_buy_upgrade(data, cheapest_purchase)
    }

    if (data.non_persist.run_active == true) {
        last_game_tick += time_elapsed
        if (last_game_tick > 0.016) {
            while (last_game_tick > 0.016 && data.non_persist.run_active == true) {
                last_game_tick -= 0.016

                document.getElementById("start_run_button").setAttribute("disabled", "disabled")
                data.non_persist.run.move_tick += calculate_move_speed(data) / 60

                let current_courage_loss = calculate_courage_change(data)
                data.non_persist.run.character_stats.courage = Math.min(Math.max(data.non_persist.run.character_stats.courage + current_courage_loss / 60, 0), data.non_persist.run.character_stats.max_courage)
                
                let current_health_change = calculate_health_change(data)
                data.non_persist.run.character_stats.health = Math.min(Math.max(data.non_persist.run.character_stats.health + current_health_change / 60, 0), data.non_persist.run.character_stats.max_health)
                
                if (data.non_persist.run.character_stats.courage <= 0) {
                    end_run(data)
                    break
                }

                if (data.non_persist.run.character_stats.health <= 0) {
                    end_run(data)
                    break
                }

                if (data.non_persist.run.move_tick >= 1) {
                    data.non_persist.run.move_tick -= 1
                    
                    data.non_persist.run.progress += 1
                    if (data.non_persist.run.progress >= 10) {
                        data.non_persist.run.progress -= 10
                        data.non_persist.run.floor += 1
                        
                        if (data.non_persist.run.floor > 2) {
                            if (data.persist.unlocks.extended_upgrades != true) {
                                data.persist.unlocks.extended_upgrades = true
                            }
                            if (data.persist.unlocks.prestige != true) {
                                data.persist.unlocks.prestige = true
                            }
                        }

                        append_enemy(data, 1, 1 * Math.pow(2, (data.non_persist.run.floor - 1) / 1.2), Math.floor(Math.pow(2, (data.non_persist.run.floor - 1) / 1.67)), Math.floor((data.non_persist.run.floor - 1) / 4), 1, enemy_graphic_order[(data.non_persist.run.floor - 1) % enemy_graphic_order.length])
                    }
                    
                    data.non_persist.run.enemies.forEach((value, _index, _array) => {
                        if (data.non_persist.run.in_combat) {
                            return
                        }

                        if (value.tile == data.non_persist.run.progress) {
                            data.non_persist.run.in_combat = true
                            data.non_persist.run.attack_tick = 0
                            data.non_persist.run.enemy = value
                            return
                        }
                    })
                    document.getElementById("run_player_icon").style.setProperty("--progress", data.non_persist.run.progress)
                }

                if (data.non_persist.run.in_combat) {
                    data.non_persist.run.enemy.element.style.setProperty("--offset", "16px")
                    document.getElementById("run_player_icon").style.setProperty("--offset", "-16px")

                    data.non_persist.run.enemy.action_tick += data.non_persist.run.enemy.stats.speed / 60
                    data.non_persist.run.attack_tick += calculate_attack_speed(data) / 60

                    if (data.non_persist.run.enemy.action_tick >= 1) {
                        data.non_persist.run.enemy.action_tick -= 1
                        data.non_persist.run.character_stats.health -= calculate_damage_taken(data.non_persist.run.enemy.stats.attack, calculate_defense(data))
                    }

                    if (data.non_persist.run.attack_tick >= 1) {
                        data.non_persist.run.attack_tick -= 1
                        data.non_persist.run.enemy.stats.health -= calculate_damage_taken(calculate_attack(data), data.non_persist.run.enemy.stats.defense)
                    }

                    if (data.non_persist.run.enemy.stats.health <= 0) {
                        document.getElementById("enemy_stats_container").style.display = "none"

                        data.non_persist.run.enemy_kills += 1

                        data.non_persist.run.in_combat = false
                        remove_enemy(data, data.non_persist.run.enemy.tile)
                        data.non_persist.run.enemy = null
                    }
                } else {
                    document.getElementById("run_player_icon").style.setProperty("--offset", "0px")
                }
            
                if (data.non_persist.run.in_combat) {
                    if (data.persist.unlocks.combat != true) {
                        data.persist.unlocks.combat = true
                    }
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

function display_tick(data) {
    upgrade_buttons.forEach((value, _index, _array) => {
        evaluate_upgrade_button(data, value)
    })

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

    document.getElementById("ascend_button").style.display = (data.persist.unlocks.ascension == true? "block" : "none");
    document.getElementById("ascension_counter").style.display = (data.persist.unlocks.ascension == true? "block" : "none");
    document.getElementById("ascension_point_display").style.display = (data.persist.unlocks.ascension == true? "block" : "none");

    document.getElementById("upgrade_tab_prestige").style.display = (data.persist.unlocks.prestige_upgrades == true? "block" : "none");
    document.getElementById("upgrade_tab_combat").style.display = (data.persist.unlocks.combat == true? "block" : "none");

    document.getElementById("player_stats_container").style.display = (data.persist.other.runs_started > 0? "inline-block" : "none");

    if (data.persist.unlocks.prestige_upgrades == true) {
        document.getElementById("prestige_point_display").innerHTML = "Prestige Points: " + data.persist.currencies.prestige_points.toFixed(2).toString()
    }

    if (data.persist.unlocks.prestige == true) {
        document.getElementById("prestige_counter").innerHTML = "Prestige " + (data.persist.layers.prestige > 0? data.persist.layers.prestige : 0).toString()

        let prestige_button = document.getElementById("prestige_button")

        if (prestige_available(data)) {
            prestige_button.innerHTML = "+" + calculate_prestige_reward(data).toFixed(2).toString() + " Prestige Points"
            prestige_button.removeAttribute("disabled");
        } else {
            prestige_button.innerHTML = "Reach Floor 6"
            prestige_button.setAttribute("disabled", "hi");
        }
    }

    if (data.persist.unlocks.ascension == true) {
        document.getElementById("ascension_counter").innerHTML = "Ascensions: " + (data.persist.layers.ascension > 0? data.persist.layers.ascension : 0).toString()
        document.getElementById("ascension_point_display").innerHTML = "Ascension Points: " + data.persist.currencies.ascension_points.toFixed(2).toString()

        let ascend_button = document.getElementById("ascend_button")

        if (ascension_available(data)) {
            ascend_button.innerHTML = "Ascend"
            ascend_button.removeAttribute("disabled");
        } else {
            let prestige_needed = Math.max(0, 10 - data.persist.currencies.prestige_points)
            ascend_button.innerHTML = "Gain " + prestige_needed.toFixed(0) + " More Prestige Points to Ascend"
            ascend_button.setAttribute("disabled", "hi");
        }
    }

    if (data.persist.unlocks.transcendence == true) {
        document.getElementById("transcendence_point_display").innerHTML = "Transcendence Points: " + data.persist.currencies.transcendence_points.toFixed(2).toString()
    }

    if (data.persist.unlocks.upgrades) {
        document.getElementById("research_display").innerHTML = "Research: " + data.persist.currencies.research.toFixed(2).toString()
        document.getElementById("currency_display").style.height = "24px";
    } else {
        document.getElementById("currency_display").style.height = "0px";
    }

    document.getElementById("health_bar").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_attack").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_defense").style.display = (data.persist.unlocks.combat? "block" : "none");
    document.getElementById("player_attack_speed").style.display = (data.persist.unlocks.combat? "block" : "none");

    document.getElementById("player_attack").innerHTML = "Attack: " + calculate_attack(data).toFixed(1).toString()
    document.getElementById("player_defense").innerHTML = "Defense: " + calculate_defense(data).toFixed(1).toString()
    document.getElementById("player_attack_speed").innerHTML = "Attack Speed: " + calculate_attack_speed(data).toFixed(2).toString() + "x"
    document.getElementById("player_speed").innerHTML = "Move Speed: " + calculate_move_speed(data).toFixed(2).toString() + "x"

    document.querySelector("#courage_bar > .bar_text").innerHTML = "Courage: " + data.non_persist.run.character_stats.courage.toFixed(1).toString()  + "/" + data.non_persist.run.character_stats.max_courage.toFixed(0).toString()
    if (data.non_persist.run_active) {
        let research_gain = calculate_research_gain(data)
        document.getElementById("research_display").innerHTML = "Research: " + data.persist.currencies.research.toFixed(2).toString() + " (+" + research_gain.toFixed(2).toString() + ")"

        let current_courage_loss = calculate_courage_change(data)

        document.querySelector("#courage_bar > .bar_text").innerHTML = "Courage: " + data.non_persist.run.character_stats.courage.toFixed(1).toString()  + "/" + data.non_persist.run.character_stats.max_courage.toFixed(0).toString() + " (" + current_courage_loss.toFixed(2).toString() + "/s)"
    }
    
    document.querySelector("#courage_bar > .fill_bar").style.setProperty("--percent", data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage)

    document.querySelector("#health_bar > .bar_text").innerHTML = "Health: " + data.non_persist.run.character_stats.health.toFixed(1).toString()  + "/" + data.non_persist.run.character_stats.max_health.toFixed(1).toString()
    document.querySelector("#health_bar > .fill_bar").style.setProperty("--percent", data.non_persist.run.character_stats.health / data.non_persist.run.character_stats.max_health)

    document.getElementById("enemy_stats_container").style.display = (data.non_persist.run.in_combat? "inline-block" : "none");
    if (data.non_persist.run.enemy) {
        document.getElementById("enemy_attack").innerHTML = "Attack: " + data.non_persist.run.enemy.stats.attack.toFixed(1).toString()
        document.getElementById("enemy_defense").innerHTML = "Defense: " + data.non_persist.run.enemy.stats.defense.toFixed(1).toString()
        document.getElementById("enemy_speed").innerHTML = "Attack Speed: " + data.non_persist.run.enemy.stats.speed.toFixed(2).toString() + "x"

        document.querySelector("#enemy_health_bar > .bar_text").innerHTML = "Health: " + data.non_persist.run.enemy.stats.health.toFixed(1).toString()  + "/" + data.non_persist.run.enemy.stats.max_health.toFixed(1).toString()
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
    prestige_reward *= (data.persist.upgrades.paradox_engine > 0? Math.pow(1.5, data.persist.upgrades.paradox_engine) : 1)
    data.persist.currencies.prestige_points += prestige_reward
    data.persist.currencies.research = data.persist.layers.prestige * 0.5
    data.persist.other.records.floor = 0

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

    document.getElementById("prestige_button").addEventListener("click", (_self, _event) => {
        attempt_prestige(data)
    })

    document.getElementById("ascend_button").addEventListener("click", (_self, _event) => {
        attempt_ascension(data)
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