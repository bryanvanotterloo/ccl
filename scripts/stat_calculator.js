function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    }
    return num.toFixed(2)
}

function calculate_courage_loss_multiplier(data) {
    let multiplier = 1

    // Combat Upgrades
    multiplier *= (data.persist.upgrades.combat_sword >= 1? 0.9 : 1)
    multiplier *= (data.persist.upgrades.combat_armor >= 1? 0.9 : 1)
    multiplier *= (data.persist.upgrades.combat_boots >= 1? 0.9 : 1)

    // Careful Looking Nerf
    multiplier *= (data.persist.upgrades.careful_looking == 1? 1.1 : 1)

    // Torch Buff Upgrade
    multiplier *= (data.persist.upgrades.torch_buff1 > 0? Math.max(0, 1 - 0.1 * data.persist.upgrades.torch_buff1) : 1)

    // Mental Endurance Upgrade
    multiplier *= (data.persist.upgrades.compound_courage > 0? Math.pow(0.8, data.persist.upgrades.compound_courage) : 1)

    multiplier *= (data.persist.upgrades.prestige_courage_loss > 0? Math.pow(0.875, data.persist.upgrades.prestige_courage_loss) : 1)

    return multiplier
}

function calculate_courage_change(data) {
    let run_data = data.non_persist.run

    let floor_loss_exponent = 2
    let add_courage_loss = -Math.pow(floor_loss_exponent, run_data.floor - 1)

    // Torch Upgrade
    add_courage_loss += (data.persist.upgrades.torch == 1? 0.25 : 0) + (data.persist.upgrades.torch_buff > 0? 0.05 * data.persist.upgrades.torch_buff : 0)

    add_courage_loss *= calculate_courage_loss_multiplier(data)

    // Well cheers!
    if (data.persist.upgrades.well_cheers != null && (data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage) > 0.5) {
        add_courage_loss *= 0.75
    }

    if (data.non_persist.run.in_combat) {
        add_courage_loss = 0
    }

    // Feelin' fine
    if (data.persist.upgrades.feeling_fine != null && (data.non_persist.run.character_stats.health / data.non_persist.run.character_stats.max_health) > 0.5) {
        add_courage_loss += 0.05 * data.persist.upgrades.feeling_fine
    }

    return add_courage_loss
}

function calculate_health_change(data) {
    let health_change = 0

    // Well cheers!
    if (data.persist.upgrades.well_cheers != null && (data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage) > 0.5) {
        health_change += 0.05 * data.persist.upgrades.well_cheers
    }

    health_change += (data.persist.upgrades.slow_recover > 0 && data.non_persist.run.in_combat == false? 0.125 * Math.pow(1.5, data.persist.upgrades.slow_recover) : 0)

    return health_change
}

function calculate_health(data) {
    let return_health = 5

    // Endurance Training
    return_health += (data.persist.upgrades.train_endurance > 0? data.persist.upgrades.train_endurance : 0)

    return_health += (data.persist.upgrades.prestige_health > 0? Math.pow(2, data.persist.upgrades.prestige_health) : 0)

    return_health *= (data.persist.upgrades.ascended_health > 0? 1 + (0.1 * data.persist.upgrades.ascended_health * data.persist.layers.ascension) : 1)

    // Ascendant Form
    return_health *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)

    return return_health
}

function calculate_defense(data) {
    let return_defense = 0

    // Combat Armor
    return_defense += (data.persist.upgrades.combat_armor > 0? data.persist.upgrades.combat_armor : 0)

    // Feelin' fine
    if (data.persist.upgrades.feeling_fine != null && (data.non_persist.run.character_stats.health / data.non_persist.run.character_stats.max_health) > 0.5) {
        return_defense += 1
    }

    return_defense += (data.persist.upgrades.prestige_defense > 0? data.persist.upgrades.prestige_defense : 0)

    return_defense += (data.persist.upgrades.enhance_armor > 0? 2 * data.persist.upgrades.enhance_armor : 0)

    return_defense *= (data.persist.upgrades.ascended_defense > 0? 1 + (0.1 * data.persist.upgrades.ascended_defense * data.persist.layers.ascension) : 1)

    // Ascendant Form
    return_defense *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)

    return return_defense
}

function calculate_attack(data) {
    let return_attack = 1

    // Combat Sword
    return_attack += (data.persist.upgrades.combat_sword > 0? data.persist.upgrades.combat_sword : 0)

    return_attack += (data.persist.upgrades.enhance_sword > 0? 2 * Math.pow(1.25, data.persist.upgrades.enhance_sword) : 0)

    // Prestige Attack
    return_attack += (data.persist.upgrades.prestige_attack > 0? 0.5 * data.persist.upgrades.prestige_attack : 0)

    // Ascension Attack
    return_attack *= (data.persist.upgrades.ascended_attack > 0? 1 + (0.1 * data.persist.upgrades.ascended_attack * data.persist.layers.ascension) : 1)

    // Ascendant Form
    return_attack *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)

    return return_attack
}

function calculate_attack_speed(data) {
    let return_attack_speed = 1

    // Agility Training
    return_attack_speed += (data.persist.upgrades.train_agility > 0? (0.1 * data.persist.upgrades.train_agility) : 0)

    // Ascendant Form
    return_attack_speed *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)

    return return_attack_speed
}

function calculate_move_speed(data) {
    if (data.non_persist.run.in_combat) {
        return 0
    }
    
    let base_move_speed = 1
    let courage_ratio = data.non_persist.run.character_stats.courage / 
                       data.non_persist.run.character_stats.max_courage
                       
    // Combat Boots - unchanged (additive)
    base_move_speed += (data.persist.upgrades.combat_boots > 0? 
                        (0.1 * data.persist.upgrades.combat_boots) : 0)
    
    // Panicked Pace - MULTIPLICATIVE
    if (data.persist.upgrades.growing_pace > 0) {
        let courage_scaled_multiplier = 1 + (((0.1 * data.persist.upgrades.growing_pace)) * (courage_ratio))
        base_move_speed *= courage_scaled_multiplier
    }
    
    //Ascendant Form - MULTIPLICATIVE
    base_move_speed *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)
    
    return base_move_speed
}

function calculate_research_gain(data) {
    let run_data = data.non_persist.run

    let base_research_gain = (run_data.floor - 1) + run_data.progress / 10

    // Careful Looking
    base_research_gain *= (data.persist.upgrades.careful_looking > 0? 1 + 0.2 * data.persist.upgrades.careful_looking : 1)

    base_research_gain += (data.persist.upgrades.enemy_bounty > 0? 0.5 * data.persist.upgrades.enemy_bounty * data.non_persist.run.enemy_kills : 0)

    // Compounding Discoveries
    base_research_gain *= (data.persist.upgrades.compound_research > 0? 1 + (0.1 * data.persist.upgrades.compound_research * (data.non_persist.run.floor)) : 1)

    base_research_gain *= (data.persist.upgrades.prestige_research > 0? 1 + 0.5 * data.persist.upgrades.prestige_research : 1)

    base_research_gain *= (data.persist.upgrades.ascended_research > 0? 1 + (0.5 * data.persist.upgrades.ascended_research * data.persist.layers.ascension) : 1)

    return base_research_gain
}

function calculate_damage_taken(damage, defense) {
    return Math.max(damage - defense, .01)
}

function evaluate_dynamic_amount(dynamic, level) {
    if (dynamic.type == "flat") {
        return level == 0 ? 0 : dynamic.value;
    }
    if (dynamic.type == "flat_constant") {
        return dynamic.value
    }
    if (dynamic.type == "increment") {
        return dynamic.value * level;
    }
    if (dynamic.type == "increment_cost") {
        return dynamic.value * (level > 0? level : 1);
    }
    if (dynamic.type == "multiply") {
        return level == 0 ? dynamic.value : dynamic.value * Math.pow(dynamic.multiplier, level);
    }
    if (dynamic.type == "multiply_effect") {
        return level == 0 ? 0 : dynamic.value * Math.pow(dynamic.multiplier, level);
    }
    return null
}

function calculate_start_courage(data) {
    let return_courage = 5

    return_courage += (data.persist.upgrades.swallow_inhibitions > 0? data.persist.upgrades.swallow_inhibitions : 0)
    return_courage += (data.persist.upgrades.basic_routine > 0? data.persist.upgrades.basic_routine : 0)

    return_courage *= (data.persist.upgrades.prestige_courage > 0? 1 + 0.25 * data.persist.upgrades.prestige_courage : 1)

    return_courage *= (data.persist.upgrades.ascended_courage > 0? 1 + (0.1 * data.persist.upgrades.ascended_courage * data.persist.layers.ascension) : 1)

    // Ascendant Form
    return_courage *= (data.persist.upgrades.ascendant_form > 0? 1 + 0.01 * data.persist.upgrades.ascendant_form : 1)

    return return_courage
}

function calculate_player_stats(data) {
    data.non_persist.run.character_stats.max_courage = calculate_start_courage(data)
    data.non_persist.run.character_stats.courage = data.non_persist.run.character_stats.max_courage

    data.non_persist.run.character_stats.max_health = calculate_health(data)
    data.non_persist.run.character_stats.health = data.non_persist.run.character_stats.max_health
}

function calculate_prestige_reward(data) {
    let return_prestige = 0
    if ((data.persist.other.records.floor - 1) < 5) {
        return_prestige = 0
    }
    else
    {
        return_prestige = Math.pow(data.persist.other.records.floor, 0.7) - 2
    }
    //return prestige multiplied by ascension prestige upgrade
    return_prestige *= (data.persist.upgrades.paradox_engine > 0? Math.pow(1.5, data.persist.upgrades.paradox_engine) : 1)
    return return_prestige
}


function calculate_ascension_reward(data) {
    let floor_bonus = Math.floor((data.persist.layers.max_floor_this_ascension - 1) / 3)

    return floor_bonus
}

function calculate_transcendence_reward(data) {
    let ascensions = data.persist.layers.ascension || 0
    let max_floor = data.persist.layers.max_floor_this_ascension || 0
    let transcendence_reward = Math.floor(ascensions / 5) + (max_floor / 10)

    return Math.max(1, transcendence_reward * (data.persist.upgrades.infinite_recursion > 0? 1.2 : 1))
}
function calculate_upgrade_stats(data) {
    let upgrades = data.persist.upgrades
    let stats = []

    function add_multiplier(label, value, suffix = "") {
        if (Math.abs(value - 1) > 1e-9) {
            stats.push({ label: label, prefix: "x", value: value, suffix: suffix })
        }
    }

    function add_flat(label, value, suffix = "") {
        if (Math.abs(value) > 1e-9) {
            stats.push({ label: label, prefix: "+", value: value, suffix: suffix })
        }
    }

    add_multiplier("Max Courage", calculate_start_courage(data) / 5)
    add_multiplier("Courage Drain", calculate_courage_loss_multiplier(data))
    add_flat("Courage Regen", (upgrades.torch == 1? 0.25 : 0) + (upgrades.torch_buff > 0? 0.05 * upgrades.torch_buff : 0) + (upgrades.feeling_fine > 0? 0.05 * upgrades.feeling_fine : 0), "/s")

    let research_multiplier = 1
    research_multiplier *= (upgrades.careful_looking > 0? 1 + 0.2 * upgrades.careful_looking : 1)
    research_multiplier *= (upgrades.prestige_research > 0? 1 + 0.5 * upgrades.prestige_research : 1)
    research_multiplier *= (upgrades.ascended_research > 0? 1 + (0.5 * upgrades.ascended_research * data.persist.layers.ascension) : 1)
    add_multiplier("Research Gain", research_multiplier)

    // Compounding Discoveries: +10% research per level per floor reached this run
    if (upgrades.compound_research > 0) {
        stats.push({ label: "Research / Floor", prefix: "+", value: 0.1 * upgrades.compound_research, suffix: "x" })
        if (data.non_persist.run_active) {
            add_multiplier("Floor Research (now)", 1 + 0.1 * upgrades.compound_research * data.non_persist.run.floor)
        }
    }
    add_flat("Research / Kill", (upgrades.enemy_bounty > 0? 0.5 * upgrades.enemy_bounty : 0))

    add_multiplier("Max Health", calculate_health(data) / 5)
    add_flat("Health Regen", (upgrades.slow_recover > 0? 0.125 * Math.pow(1.5, upgrades.slow_recover) : 0) + (upgrades.well_cheers > 0? 0.05 * upgrades.well_cheers : 0), "/s")
    add_multiplier("Attack", calculate_attack(data))
    add_multiplier("Defense", calculate_defense(data))
    add_multiplier("Attack Speed", calculate_attack_speed(data))
    add_multiplier("Move Speed", 1 + (upgrades.combat_boots > 0? 0.1 * upgrades.combat_boots : 0))

    // Panicked Pace: move speed scales up as courage drops, maxing out at 0 courage
    if (upgrades.growing_pace > 0) {
        add_multiplier("Panic Pace (max)", 1 + 0.1 * upgrades.growing_pace)
        if (data.non_persist.run_active) {
            let courage_ratio = data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage
            stats.push({ label: "Panic Pace (now)", prefix: "x", value: 1 + 0.1 * upgrades.growing_pace * (courage_ratio), suffix: "" })
        }
    }

    add_multiplier("Prestige Gain", (upgrades.paradox_engine > 0? Math.pow(1.5, upgrades.paradox_engine) : 1))

    let cost_multiplier = 1
    cost_multiplier *= (upgrades.eternal_scaling > 0? 1 - (0.05 * upgrades.eternal_scaling) : 1)
    cost_multiplier *= (upgrades.cascade_reaction > 0? 1 - (0.05 * Math.min(upgrades.cascade_reaction, 5)) : 1)
    add_multiplier("Upgrade Cost", cost_multiplier)

    return stats
}
