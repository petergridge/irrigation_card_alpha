class IrrigationCard extends HTMLElement {

	setConfig(config) {
	  if (!config.program) {
		throw new Error('Please specify an irrigation program');
	  }

	  if (this.lastChild) this.removeChild(this.lastChild);
	  const cardConfig = Object.assign({}, config);
	  if (!cardConfig.card) cardConfig.card = {};
	  if (!cardConfig.card.type) cardConfig.card.type = 'entities';
	  if (!cardConfig.entities_vars) cardConfig.entities_vars = { type: 'entity' };
	  const element = document.createElement(`hui-${cardConfig.card.type}-card`);
	  this.appendChild(element);
	  this._config = JSON.parse(JSON.stringify(cardConfig));
	}

	set hass(hass) {
	  const config = this._config;

	  config.card.title = config.title;
	  //https://www.home-assistant.io/lovelace/header-footer/
	  config.card.header = config.header;
	  config.card.footer = config.footer;
	  config.card.icon = config.icon;
	  config.card.theme = config.theme;
	  config.card.show_header_toggle = false;
	  config.card.state_color = true;
	  let defentities = [];
	  let validconfig = 'invalid';

		let zones = Number(hass.states[config.program].attributes['zone_count']);
		let last_run_zones = "";

		let	runtimes = [];
		let	zone_attrs = [];
		let zfname = ""
		let zname = ""

 
	  const x = hass.states[config.program];
	  if (!x) {
		  config.card.title = 'ERR';
		  validconfig == 'invalid'
		  defentities.push({
						  type: 'section',
						  label: 'Program: not found'
						  });
		  config.card.title = 'ERROR: ' + config.program;
	  } else {
		  validconfig = 'valid';
	  }

	  if (validconfig === 'valid') {
		  if (!hass.states[config.program].attributes['zone_count']) {
			  defentities.push({
							  type: 'section',
							  label: 'Program: not v4 or newer irriation component'
							  });
			  config.card.title = 'ERROR: ' + config.program;
			  validconfig = 'invalid';
		  }
	  }

	  function cardentities(hass, program) {
		  let entities = []

		  function add_button_service(p_service, p_name, p_action_name, p_data, p_conditions) {
				entities.push({
					type: 'conditional',
					conditions: p_conditions,
					row:
						{
					type: 'button',
					name: p_name,
					icon: 'mdi:power',
					action_name: p_action_name,
					tap_action:
						{
						action: 'call-service',
						service: p_service,
						service_data:
							p_data
						}
					}
				});
		  }//add_button_service

		  function add_button_off(p_name, p_action_name, p_data, p_conditions) {
				entities.push({
					type: 'conditional',
					conditions: p_conditions,
					row:
					{
					type: 'button',
					name: p_name,
					icon: 'mdi:power',
					action_name: p_action_name,
					tap_action:
						{
						action: 'call-service',
						service: 'switch.turn_off',
						data: {},
						target: {
						  entity_id: p_data
						}
						}
					}
				});
		  }//add_button_off
			
		  function add_entity(p_conditions, p_entity, array) {
			  if(hass.states[config.program].attributes[p_entity]) {
          if(p_conditions == null) {
						array.push(hass.states[config.program].attributes[p_entity]);					
				  } else {
  				  array.push({ type: 'conditional',
								  conditions: p_conditions,
								  row: {entity: hass.states[config.program].attributes[p_entity]}
							  });
					}
			  }
		  }//add_entity

		  function add_attribute(p_attribute, p_name, p_icon, p_conditions, array) {
			  if(hass.states[config.program].attributes[p_attribute]) {
          if(p_conditions == null) {
    			  array.push({ type: 'attribute',
					  entity: config.program,
					  attribute: p_attribute,
						format: 'relative',
					  name: p_name,
					  icon: p_icon });
			    } else {
				  array.push({ type: 'conditional',
								  conditions: p_conditions,
								  row: {type: 'attribute',
									  entity: config.program,
									  attribute: p_attribute,
										format: 'relative',
									  name: p_name,
									  icon: p_icon }
							  });
			    }
			  }
		  }//add_attribute

			function attr_value(p_attribute) {
				let attrvalue = null;
				if (hass.states[config.program].attributes[p_attribute]) {
					attrvalue = hass.states[config.program].attributes[p_attribute];
				}
				return attrvalue;
			}//attr_value

			function add_attr_value(p_attribute, array) {
				if (attr_value(p_attribute)) {
					if(showconfig) {
						add_entity([{entity: showconfig, state: 'on'}],p_attribute,array);
					} else{
						add_entity(null, p_attribute, array)
					}
				}
			}//add_attr_value


			function ProcessZone(array) {
				name = array[0].split(".")[1];
				add_attribute( name + '_remaining',
							hass.states['switch.'+name].attributes['friendly_name'],
							'mdi:timer-outline',
							[{entity: config.program, state: 'on'}],
							runtimes
							);
				// list of other in order
				add_attr_value(name + '_run_freq', zone_attrs);
				add_attr_value(name + '_water', zone_attrs);
 			  add_attr_value(name + '_water_adjustment', zone_attrs);
   			add_attr_value(name + '_flow_sensor', zone_attrs);
				add_attr_value(name + '_wait', zone_attrs);
				add_attr_value(name + '_repeat', zone_attrs);
				add_attr_value(name + '_rain_sensor', zone_attrs);
				add_attr_value(name + '_ignore_rain_sensor', zone_attrs);
			} //ProcessZone

			//check if two arrays are the same
			const equalsCheck = (a, b) =>
					a.length === b.length &&
					a.every((v, i) => v === b[i]);

			function ProcessGroup(array) {
				// return true if the group is consistent
				if (array.length == 0) return false;
				let basezone = [];
				for (var i = 0; i < array.length; i++) {
					
					name = array[i].split(".")[1];
					
					// list of other in order
					let zone = [];
					zone.push(hass.states[config.program].attributes[name + '_run_freq']);
					zone.push(hass.states[config.program].attributes[name + '_water']);
					zone.push(hass.states[config.program].attributes[name + '_water_adjustment']);
					zone.push(hass.states[config.program].attributes[name + '_flow_sensor']);
					zone.push(hass.states[config.program].attributes[name + '_wait']);
					zone.push(hass.states[config.program].attributes[name + '_repeat']);
					zone.push(hass.states[config.program].attributes[name + '_rain_sensor']);
					zone.push(hass.states[config.program].attributes[name + '_ignore_rain_sensor']);

					if (i == 0) {
						basezone = zone;
						continue;
					}
					if (equalsCheck(basezone,zone)) {
						//we have a match move onto the next zone in the array
						basezone = zone;
					}else{
						return false;
					}
				}
				return true;
			}	//ProcessGroup
			
			function getName(value, index, array) {
				name = value.split(".")[1];
				zfname += (hass.states[value].attributes['friendly_name'] + ", ");
			} //getName

			function ZoneHeader(zones,zname) {
				// if this card instance is showing only zones
				if (show_program === false) {
					config.card.title = hass.states[config.program].attributes['friendly_name'];
				} 
				entities.push({ type: 'section',
								label: ""
							});
				

				zfname = "";
				zones.forEach(getName);
				zfname = zfname.substring(0, zfname.length-2);

				add_button_service(
					'irrigationprogram.run_zone',
					zfname,
					'RUN',
					{
					entity_id: config.program,
					zone: zones,
					},
					[{entity: config.program, state: 'off'}]
				);

				add_button_off(
					zfname,
					'STOP',
					zones,
					[{entity: config.program, state: 'on'}]
				);
			
				if(showconfig) {
					add_attribute(zname + '_last_ran', ' ', 'mdi:clock', [{entity: showconfig, state: 'on'},{entity: config.program, state: 'off'}],entities);
				} else {
					add_attribute(zname + '_last_ran', ' ', 'mdi:clock', [{entity: config.program, state: 'off'}],entities);
				}
			} //ZoneHeader


			// Build the Program level entities
			let show_program = true
			if (typeof config.show_program !== 'undefined') {
				if (config.show_program === true) {
					show_program = true;
				} else {
					show_program = false;
				}
			}
			
			let showconfig = hass.states[config.program].attributes['show_config'];
					
			if (show_program === true) {
				add_button_service(
					'switch.turn_on',
					hass.states[config.program].attributes['friendly_name'],
					'RUN',
					{
					entity_id: config.program,
					},
					[{entity: config.program, state: 'off'}]
				);

				add_button_service(
					'switch.turn_off',
					hass.states[config.program].attributes['friendly_name'],
					'STOP',
					{
					entity_id: config.program,
					},
					[{entity: config.program, state: 'on'}]
				);
				add_attribute( 'remaining', ' ', 'mdi:timer-outline', [{entity: config.program, state: 'on'}],entities);
				add_entity(null,'show_config',entities);

				//add the program level configuration use conditional if show config entity is provided
				add_attr_value('start_time',entities);
				add_attr_value('irrigation_on',entities);
				add_attr_value('run_freq',entities);
				add_attr_value('controller_monitor',entities);
				add_attr_value('inter_zone_delay',entities);
			}

			let dzones = [];
      //add the entity level configuration use conditional if show config entity is provided
		  for (let i = 1; i < zones + 1; i++) {
					
			  let zname = hass.states[config.program].attributes['zone' + String(i) + '_name'];
				if (config.entities) {
					if (config.entities.length > 0) {
						if ( config.entities.indexOf('switch.' + zname) == -1) {
							continue;
						}
					}
				}

				let run_zones = ['switch.' + zname];				
				if (hass.states[config.program].attributes[zname + '_group']) {
					run_zones = hass.states[config.program].attributes[zname + '_group'];
				}

				if (ProcessGroup(run_zones) === true) {
					//same group skip to the next zone
					if (equalsCheck(run_zones,last_run_zones)) continue;
					dzones = run_zones;
				} else {
					dzones = ['switch.' + zname]
				}
				ZoneHeader(run_zones, zname)
				runtimes = [];
				zone_attrs = [];
				ProcessZone(dzones);

				const newentities = entities.concat(zone_attrs, runtimes);
				entities = newentities;
				last_run_zones = run_zones;
			}
		  return entities;
	  }//cardentities

	  if (validconfig === 'valid') {
		  config.card.entities = cardentities(hass, config.program);
	  }
	  else {
		  config.card.entities = defentities;
	  }

	  this.lastChild.setConfig(config.card);
	  this.lastChild.hass = hass;
	}

	getCardSize() {
	  return 'getCardSize' in this.lastChild ? this.lastChild.getCardSize() : 1;
	}
  }

  customElements.define('irrigation-card', IrrigationCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
	type: "irrigation-card",
	name: "Irrigation Card",
	preview: true, // Optional - defaults to false
	description: "Custom card companion to Irrigation Custom Component" // Optional
  });
