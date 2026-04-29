function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    }
    return num.toFixed(2)
}

function calculate_courage_change(data) {
    let run_data = data.non_persist.run

    let floor_loss_exponent = 2
    let add_courage_loss = -Math.pow(floor_loss_exponent, run_data.floor - 1)

    // Torch Upgrade
    add_courage_loss += (data.persist.upgrades.torch == 1? 0.25 : 0) + (data.persist.upgrades.torch_buff > 0? 0.05 * data.persist.upgrades.torch_buff : 0)

    // Combat Upgrades
    add_courage_loss *= (data.persist.upgrades.combat_sword >= 1? 0.9 : 1)
    add_courage_loss *= (data.persist.upgrades.combat_armor >= 1? 0.9 : 1)
    add_courage_loss *= (data.persist.upgrades.combat_boots >= 1? 0.9 : 1)

    // Careful Looking Nerf
    add_courage_loss *= (data.persist.upgrades.careful_looking == 1? 1.1 : 1)

    // Torch Buff Upgrade
    add_courage_loss *= (data.persist.upgrades.torch_buff1 > 0? Math.max(0, 1 - 0.1 * data.persist.upgrades.torch_buff1) : 1)

    // Mental Endurance Upgrade
    add_courage_loss *= (data.persist.upgrades.compound_courage > 0? Math.pow(0.8, data.persist.upgrades.compound_courage) : 1)

    // Well cheers!
    if (data.persist.upgrades.well_cheers != null && (data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage) > 0.5) {
        add_courage_loss *= 0.75
    }

    add_courage_loss *= (data.persist.upgrades.prestige_courage_loss > 0? Math.pow(0.875, data.persist.upgrades.prestige_courage_loss) : 1)

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

    return_health += (data.persist.upgrades.ascended_health > 0? 1 * data.persist.upgrades.ascended_health * data.persist.layers.ascension : 0)

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

    return_defense += (data.persist.upgrades.ascended_defense > 0? 0.5 * data.persist.upgrades.ascended_defense * data.persist.layers.ascension : 0)

    return return_defense
}

function calculate_attack(data) {
    let return_attack = 1

    // Combat Sword
    return_attack += (data.persist.upgrades.combat_sword > 0? data.persist.upgrades.combat_sword : 0)

    return_attack += (data.persist.upgrades.enhance_sword > 0? 2 * Math.pow(1.25, data.persist.upgrades.enhance_sword) : 0)

    return return_attack
}

function calculate_attack_speed(data) {
    let return_attack_speed = 1

    // Agility Training
    return_attack_speed += (data.persist.upgrades.train_agility > 0? (0.1 * data.persist.upgrades.train_agility) : 0)

    return return_attack_speed
}

function calculate_move_speed(data) {
    let return_move_speed = 1

    // Panicked Pace
    return_move_speed += (data.persist.upgrades.growing_pace > 0? (0.2 * data.persist.upgrades.growing_pace) * (1 - data.non_persist.run.character_stats.courage / data.non_persist.run.character_stats.max_courage) : 0)

    // Combat Boots
    return_move_speed += (data.persist.upgrades.combat_boots > 0? (0.1 * data.persist.upgrades.combat_boots) : 0)

    return data.non_persist.run.in_combat? 0 : return_move_speed
}

function calculate_research_gain(data) {
    let run_data = data.non_persist.run

    let base_research_gain = (run_data.floor - 1) + run_data.progress / 10

    // Careful Looking
    base_research_gain *= (data.persist.upgrades.careful_looking > 0? 1 + 0.2 * data.persist.upgrades.careful_looking : 1)

    base_research_gain += (data.persist.upgrades.enemy_bounty > 0? 0.5 * data.persist.upgrades.enemy_bounty * data.non_persist.run.enemy_kills : 0)

    // Compounding Discoveries
    base_research_gain *= (data.persist.upgrades.compound_research > 0? 1 + (0.1 * data.persist.upgrades.compound_research * (data.non_persist.run.floor - 1)) : 1)

    base_research_gain *= (data.persist.upgrades.prestige_research > 0? 1 + 0.5 * data.persist.upgrades.prestige_research : 1)

    base_research_gain *= (data.persist.upgrades.ascended_research > 0? 1 + (0.5 * data.persist.upgrades.ascended_research * data.persist.layers.ascension) : 1)

    return base_research_gain
}

function calculate_damage_taken(damage, defense) {
    return Math.max(damage - defense, 1)
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

    return_courage += (data.persist.upgrades.ascended_courage > 0? 0.5 * data.persist.upgrades.ascended_courage * data.persist.layers.ascension : 0)

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

    return return_prestige
}

function calculate_ascension_reward(data) {
    let prestige_count = data.persist.layers.prestige / 10
    let floor_bonus = Math.floor((data.persist.layers.max_floor_this_ascension - 1) / 5)

    return prestige_count + floor_bonus
}
