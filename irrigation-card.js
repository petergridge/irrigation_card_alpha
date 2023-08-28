class IrrigationCard extends HTMLElement {
  setConfig(config) {
    if (this.lastChild) this.removeChild(this.lastChild);
    const cardConfig = Object.assign({}, config);
    if (!cardConfig.card) cardConfig.card = {};
    if (!cardConfig.card.type) cardConfig.card.type = "entities";
    if (!cardConfig.entities_vars)
      cardConfig.entities_vars = { type: "entity" };
    const element = document.createElement(`hui-${cardConfig.card.type}-card`);
    this._config = JSON.parse(JSON.stringify(cardConfig));
    customElements.whenDefined("card-mod").then(() => {
      customElements
        .get("card-mod")
        .applyToElement(element, "card-mod-card", this._config.card_mod.style);
    });

    this.appendChild(element);
  }

  set hass(hass) {
    let entities = [];

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
    let validconfig = "invalid";

    let zones = Number(hass.states[config.program].attributes["zone_count"]);
    let last_run_zones = "";

    let runtimes = [];
    let zone_attrs = [];
    let zfname = "";
    let zname = "";
    let first_zone = null;
    let showconfig = null;

    const x = hass.states[config.program];
    if (!x) {
      config.card.title = "ERR";
      validconfig == "invalid";
      defentities.push({
        type: "section",
        label: "Program: not found",
      });
      config.card.title = "ERROR: " + config.program;
    } else {
      validconfig = "valid";
    }

    if (validconfig === "valid") {
      if (!hass.states[config.program].attributes["zone_count"]) {
        defentities.push({
          type: "section",
          label: "Program: not v4 or newer irriation component",
        });
        config.card.title = "ERROR: " + config.program;
        validconfig = "invalid";
      }
    }

    function cardentities(hass, program) {
      function addZoneRunConfigButtons(p_zones, p_config) {
        var zone_name = hass.states[p_zones[0]].attributes["friendly_name"];
        for (let i = 1; i < p_zones.length; i++) {
          zone_name += ', ' + (hass.states[p_zones[i]].attributes["friendly_name"]);
        }

        var buttons = [];
        buttons[0] = {
          entity: p_zones[0],
          name: zone_name,
          icon: "mdi:water",
          tap_action: {
            action: "call-service",
            service: "irrigationprogram.toggle_zone",
            service_data: {
              entity_id: config.program,
              zone: p_zones,
            },
          },
        };

        buttons[1] = {
          entity: p_config,
          show_name: false,
          tap_action: {
            action: "call-service",
            service: "irrigationprogram.toggle",
            service_data: {
              entity_id: p_config,
            },
          },
        };

        entities.push({
          type: "buttons",
          entities: buttons,
        });
      } //addZoneRunConfigButtons

      function addProgramRunConfigButtons(p_config) {
        var buttons = [];
        buttons[0] = {
          entity: config.program,
          show_name: true,
          icon: "mdi:power",
        };

				//check if there are any other attributes to show
				// before creating this button
				if (hass.states[config.program].attributes["irrigation_on"]
					|| hass.states[config.program].attributes["run_freq"]
					|| hass.states[config.program].attributes["controller_monitor"]
					|| hass.states[config.program].attributes["inter_zone_delay"]
				    ) {
					buttons[1] = {
						entity: p_config,
						show_name: false,
						tap_action: {
							action: "call-service",
							service: "irrigationprogram.toggle",
							service_data: {
								entity_id: p_config,
							},
						},
					};
				}

        entities.push({
          type: "buttons",
          entities: buttons,
        });
      } //addProgramRunConfigButtons

      function add_entity(p_conditions = [], p_entity, array) {
        if (hass.states[config.program].attributes[p_entity]) {
          array.push({
            type: "conditional",
            conditions: p_conditions,
            row: { entity: hass.states[config.program].attributes[p_entity] },
          });
        }
      } //add_entity

      function add_attribute(p_attribute, p_name, p_icon, p_conditions, array) {
        if (hass.states[config.program].attributes[p_attribute]) {
          array.push({
            type: "conditional",
            conditions: p_conditions,
            row: {
              type: "attribute",
              entity: config.program,
              attribute: p_attribute,
              format: "relative",
              name: p_name,
              icon: p_icon,
            },
          });
        }
      } //add_attribute

      function attr_value(p_attribute) {
        let attrvalue = null;
        if (hass.states[config.program].attributes[p_attribute]) {
          attrvalue = hass.states[config.program].attributes[p_attribute];
        }
        return attrvalue;
      } //attr_value

      function add_attr_value(p_attribute, array) {
        if (attr_value(p_attribute)) {
          add_entity([{ entity: showconfig, state: "on" }], p_attribute, array);
        }
      } //add_attr_value

      function ProcessZone(array) {
        name = array[0].split(".")[1];
        let zonestatus =
          hass.states[config.program].attributes[name + "_status"];

        // list of other in order
        add_attr_value(name + "_enable_zone", zone_attrs);
        add_attr_value(name + "_run_freq", zone_attrs);
        add_attr_value(name + "_water", zone_attrs);
        add_attr_value(name + "_water_adjustment", zone_attrs);
        add_attr_value(name + "_flow_sensor", zone_attrs);
        add_attr_value(name + "_wait", zone_attrs);
        add_attr_value(name + "_repeat", zone_attrs);
        add_attr_value(name + "_rain_sensor", zone_attrs);
        add_attr_value(name + "_ignore_rain_sensor", zone_attrs);
      } //ProcessZone

      //check if two arrays are the same
      const equalsCheck = (a, b) =>
        a.length === b.length && a.every((v, i) => v === b[i]);

      function ProcessGroup(array) {
        // return true if the group is consistent
        if (array.length == 0) return false;
        let basezone = [];
        for (var i = 0; i < array.length; i++) {
          name = array[i].split(".")[1];

          // list of other in order
          let zone = [];
          zone.push(hass.states[config.program].attributes[name + "_run_freq"]);
          zone.push(hass.states[config.program].attributes[name + "_water"]);
          zone.push(
            hass.states[config.program].attributes[name + "_water_adjustment"]
          );
          zone.push(
            hass.states[config.program].attributes[name + "_flow_sensor"]
          );
          zone.push(hass.states[config.program].attributes[name + "_wait"]);
          zone.push(hass.states[config.program].attributes[name + "_repeat"]);
          zone.push(
            hass.states[config.program].attributes[name + "_rain_sensor"]
          );
          zone.push(
            hass.states[config.program].attributes[name + "_ignore_rain_sensor"]
          );

          if (i == 0) {
            basezone = zone;
            continue;
          }
          if (equalsCheck(basezone, zone)) {
            //we have a match move onto the next zone in the array
            basezone = zone;
          } else {
            return false;
          }
        }
        return true;
      } //ProcessGroup

      function getName(value, index, array) {
        name = value.split(".")[1];
        zfname += hass.states[value].attributes["friendly_name"] + ", ";
      } //getName

      function ZoneHeader(zones, zname) {
        zfname = "";
        zones.forEach(getName);
        zfname = zfname.substring(0, zfname.length - 2);
        // process zone/zonegroup main section
        let zonestatus =
          hass.states[config.program].attributes[name + "_status"];
        if (config.show_program === false && first_zone && !config.title) {
          //do nothing
        } else {
          entities.push({ type: "section", label: "" });
        }

        showconfig =
          hass.states[config.program].attributes[zname + "_show_config"];
        addZoneRunConfigButtons(zones, showconfig);

        // Show the remaining time
        entities.push({
          type: "conditional",
          conditions: [
            { entity: zonestatus, state_not: "off" },
            { entity: zonestatus, state_not: "disabled" },
          ],
          row: {
            type: "attribute",
            entity: config.program,
            attribute: zname + "_remaining",
            name: " ",
            icon: "mdi:timer-outline",
          },
        });

        // Next/Last run details
        add_attribute(
          zname + "_next_run",
          config.next_run_label || "Next Run",
          "mdi:clock-start",
          [],
          entities
        );

        add_attribute(
          zname + "_last_ran",
          config.last_ran_label || "Last Ran",
          "mdi:clock-end",
          [
            { entity: config.program, state: "off" },
            { entity: showconfig, state: "on" },
          ],
          entities
        );
      } //ZoneHeader

      // Build the Program level entities

      if (config.show_program === true) {
        showconfig = hass.states[config.program].attributes["show_config"];
        addProgramRunConfigButtons(showconfig);
        add_entity([], "start_time", entities);
        add_attribute(
          "remaining",
          " ",
          "mdi:timer-outline",
          [{ entity: config.program, state: "on" }],
          entities
        );

        //add the program level configuration
        add_attr_value("irrigation_on", entities);
        add_attr_value("run_freq", entities);
        add_attr_value("controller_monitor", entities);
        add_attr_value("inter_zone_delay", entities);
      }

      let dzones = [];
      //add the entity level configuration use conditional if show config entity is provided
      first_zone = true;
      for (let i = 1; i < zones + 1; i++) {
        let zname =
          hass.states[config.program].attributes["zone" + String(i) + "_name"];
        if (config.entities) {
          if (config.entities.length > 0) {
            if (config.entities.indexOf("switch." + zname) == -1) {
              continue;
            }
          }
        }

        let run_zones = ["switch." + zname];
        if (hass.states[config.program].attributes[zname + "_group"]) {
          run_zones = hass.states[config.program].attributes[zname + "_group"];
        }

        if (ProcessGroup(run_zones) === true) {
          //same group skip to the next zone
          if (equalsCheck(run_zones, last_run_zones)) continue;
          dzones = run_zones;
        } else {
          dzones = ["switch." + zname];
        }
        ZoneHeader(run_zones, zname);
        runtimes = [];
        zone_attrs = [];
        ProcessZone(dzones);

        const newentities = entities.concat(zone_attrs, runtimes);
        entities = newentities;
        last_run_zones = run_zones;
        first_zone = false;
      }
      return entities;
    } //cardentities

    if (validconfig === "valid") {
      config.card.entities = cardentities(hass, config.program);
    } else {
      config.card.entities = defentities;
    }

    this.lastChild.setConfig(config.card);
    this.lastChild.hass = hass;
  }

  static getConfigElement() {
    return document.createElement("irrigation-card-editor");
  }

  static getStubConfig() {
    return {
      program: "",
      entities: [],
      show_program: true,
      next_run_label: "Next Run",
      last_ran_label: "Last Run",
    };
  }

  getCardSize() {
   return "getCardSize" in this.lastChild ? this.lastChild.getCardSize() : 1;
  }
}

class IrrigationCardEditor extends HTMLElement {
  // private properties
  _config;
  _hass;
  _elements = {};

  // lifecycle
  constructor() {
    super();
    console.log("editor:constructor()");
    this.doEditor();
    this.doStyle();
    this.doAttach();
    this.doQueryElements();
    this.doListen();
  }

  setConfig(config) {
    console.log("editor:setConfig()");
    this._config = config;
    this.doUpdateConfig();
  }

  set hass(hass) {
    console.log("editor.hass()");
    this._hass = hass;
    this.doUpdateHass();
  }

  onChanged(event) {
    console.log("editor.onChanged()");
    this.doMessageForUpdate(event);
  }

  // jobs
  doEditor() {
    this._elements.editor = document.createElement("form");
    this._elements.editor.innerHTML = `
			<div class="row"><label class="label" for="program">Program:</label><select class="value" id="program"></select></div>
			<div class="row"><label class="label" for="entities">Entity:</label><select class="value" id="entities" multiple></select></div>
			<div class="row"><label class="label" for="show_program">Show program:</label><input type="checkbox" id="show_program" checked></input></div>
			<div class="row"><label class="label" for="last_ran_label">Last ran label:</label><input type="text" id="last_ran_label" defaultValue='Last Ran'></input></div>
			<div class="row"><label class="label" for="next_run_label">Next run label:</label><input type="text" id="next_run_label" defaultValue='Next Run'></input></div>
			`;
  }
//<div class="row"><label class="label" for="debug">debug:</label><input type="text" id="debug"></input></div>
//this._elements.debug.value = select.value;


  doStyle() {
    this._elements.style = document.createElement("style");
    this._elements.style.textContent = `
              form {
                  display: table;
              }
              .row {
                  display: table-row;
              }
              .label, .value {
                  display: table-cell;
                  padding: 0.5em;
              }
          `;
  }

  doAttach() {
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(this._elements.style, this._elements.editor);
  }

  doQueryElements() {
    this._elements.program = this._elements.editor.querySelector("#program");
    this._elements.entities = this._elements.editor.querySelector("#entities");
    this._elements.show_program =
      this._elements.editor.querySelector("#show_program");
    this._elements.last_ran_label =
      this._elements.editor.querySelector("#last_ran_label");
    this._elements.next_run_label =
      this._elements.editor.querySelector("#next_run_label");

//		this._elements.debug =
//      this._elements.editor.querySelector("#debug");
  }

  doListen() {
    this._elements.program.addEventListener(
      "change",
      this.onChanged.bind(this)
    );
    this._elements.entities.addEventListener(
      "change",
      this.onChanged.bind(this)
    );
    this._elements.show_program.addEventListener(
      "change",
      this.onChanged.bind(this)
    );
    this._elements.last_ran_label.addEventListener(
      "change",
      this.onChanged.bind(this)
    );
    this._elements.next_run_label.addEventListener(
      "change",
      this.onChanged.bind(this)
    );
  }

  doBuildProgramOptions(program) {
    // build the list of available programs
    var select = this._elements.program;
    // remove the existing list
    var i = 0;
    var l = select.options.length - 1;
    for (i = l; i >= 0; i--) {
      select.remove(i);
    }

    // populate the list of programs
    for (var x in this._hass.states) {
      if (Number(this._hass.states[x].attributes["zone_count"]) > 0) {
        let newOption = new Option(x, x);
        if (x == this._config.program) {
          newOption.selected = true;
        }
        select.add(newOption);
      }
    }
    // fire a change event to action the above selection
    var event = new Event("change");
    select.dispatchEvent(event);
  }

  doBuildEntityOptions(program, entities) {
    // build the list of zones in the program
    var zones = Number(this._hass.states[program].attributes["zone_count"]);
    var select = this._elements.editor.querySelector("#entities");
    //remove existing options
    var i = 0;
    var l = select.options.length - 1;
    for (i = l; i >= 0; i--) {
      select.remove(i);
    }
    //rebuild the options
    for (i = 1; i < zones + 1; i++) {
      var zname =
        "switch." +
        this._hass.states[program].attributes["zone" + String(i) + "_name"];
      let newOption = new Option(zname, zname);
      if (entities.includes(zname)) {
        newOption.selected = true;
      }
      select.add(newOption);
    }
  }

  doUpdateConfig() {
    // Build values on load
    this.doBuildProgramOptions(this._config.program);
    this._elements.show_program.checked = this._config.show_program;
    this._elements.last_ran_label.value =
      this._config.last_ran_label || "Last Ran";
    this._elements.next_run_label.value =
      this._config.next_run_label || "Next Run";
    if (this._elements.program.value.split(".")[0] == "switch") {
      this._elements.entities.value = this._hass.config["entities"];
      this.doBuildEntityOptions(
        this._elements.program.value,
        this._config.entities
      );
    }
  }

  doUpdateHass() {}

  doMessageForUpdate(changedEvent) {
    // Update values on change the event

    // this._config is readonly, copy needed
    const newConfig = Object.assign({}, this._config);
		
    if (changedEvent.target.id == "program") {
      // get the selected program
      var select = this._elements.editor.querySelector("#program");

      // if the program has changed reset the selected zones
      if (newConfig.program != select.value) {
        newConfig.entities = [];
       this.doBuildEntityOptions(newConfig.program, []);
      }
			newConfig.program = select.value;
    } else if (changedEvent.target.id == "entities") {
      // format the list of selected zones
      var selectedentities = [];
      var count = 0;
      var select = this._elements.editor.querySelector("#entities");
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].selected) {
          selectedentities[count] = select.options[i].value;
          count++;
        }
      }
      newConfig.entities = selectedentities;
    } else if (changedEvent.target.id == "show_program") {
      newConfig.show_program = changedEvent.target.checked;
    } else if (changedEvent.target.id == "last_ran_label") {
      newConfig.last_ran_label = changedEvent.target.value;
    } else if (changedEvent.target.id == "next_run_label") {
      newConfig.next_run_label = changedEvent.target.value;
    }
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true,
    });
		event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }
}

customElements.define("irrigation-card-editor", IrrigationCardEditor);
customElements.define("irrigation-card", IrrigationCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "irrigation-card",
  name: "Irrigation Card",
  preview: true, // Optional - defaults to false
  description: "Custom card companion to Irrigation Custom Component", // Optional
});