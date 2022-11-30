# Custom Card for Irrigation Component <img src="https://github.com/petergridge/irrigation_card/blob/main/icon.png" alt="drawing" width="75"/>

This card works with [Irrigation Component](https://github.com/petergridge/irrigation_component_v5) and provides an interface reflecting the configuration of the irrigation custom component. Kudos to the HA team, the card leverages the capabilities of the default entities card.

## Installation
HACS installation
* Adding the repository using HACS is the simplest approach

Manual install
* Ensure you have advanced mode enabled in Home Assistant
* Copy irrigation-card.js to the /config/www directory in Home Assistant
* In the *configuration/LoveLace* dashboards page select the *Resources* tab
* Add the resource */local/irrigation-card.js?v=1* increment the version number if updating an exsting installation

Edit your dashboard

Add the custom card

![image](https://user-images.githubusercontent.com/40281772/204683211-cb589ccd-0183-4b50-9b03-0d6e3ea7795e.png)


## Configuration

**type:** (required) custom:irrigation-card

**program:** (required) The switch representation of the irrigation program

**title:** (optional) The title to be set in the card. defaults to the program freindly name

**icon:** (optional) An icon to display to the left of the title.

**theme:** (optional) Override the used theme for this card with any loaded theme. For more information about themes, see the [frontend documentation](https://www.home-assistant.io/integrations/frontend/).

**header:** (optional) Header widget to render an image. See [header/footer documentation](https://www.home-assistant.io/lovelace/header-footer/).

**footer:** (optional) Header widget to render and image. See [header/footer documentation](https://www.home-assistant.io/lovelace/header-footer/).

**Example:**
```yaml
type: custom:irrigation-card
program: switch.afternoon
title: Afternoon Program
```

## REVISION HISTORY
### 5.1.15
* Initial HACS release
* Sync version with Irrigation-V5
### 5.0.0
* Refactored to work with Irrigation component V5
* is not compatible with Irrigation component V4 use v1.0.11.
### 1.0.11
* Enable Zone functionality. Prerequisite is V4.0.11 of Irrigation Component V4 to support the 
### 1.0.8
* Add ability to hide/show configuration. Prerequisite is V4.0.8 of Irrigation Component V4 to support the 
### 1.0.7
* Add header and footer capability
### 1.0.6
* Add run zone functionality
### 1.0.5
* Improve code 
* add conditonal display of remaining time/last ran
### 1.0.4
* Add zone level remaining run time
### 1.0.3
* Register card so it appears on the list of cards
### 1.0.2
* Fixed missing config objects
### 1.0.1
* Updated error handling. More robust when incorrect object defined
### 1.0.0
* New repository
