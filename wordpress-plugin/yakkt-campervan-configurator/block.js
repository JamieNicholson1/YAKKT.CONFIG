/**
 * Registers a new block provided a unique name and an object defining its behavior.
 */
const { registerBlockType } = wp.blocks;
const { InspectorControls } = wp.editor;
const { PanelBody, RangeControl, TextControl } = wp.components;
const { Fragment } = wp.element;

/**
 * Register: Yakkt Campervan Configurator Block.
 */
registerBlockType('yakkt/campervan-configurator', {
    title: 'Yakkt Campervan Configurator',
    icon: 'car',
    category: 'widgets',
    attributes: {
        height: {
            type: 'string',
            default: '800px',
        },
        width: {
            type: 'string',
            default: '100%',
        },
    },

    /**
     * The edit function describes the structure of your block in the context of the editor.
     */
    edit: function(props) {
        const { attributes, setAttributes } = props;
        const { height, width } = attributes;

        return (
            <Fragment>
                <InspectorControls>
                    <PanelBody title="Configurator Settings">
                        <TextControl
                            label="Height"
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                            help="Enter height (e.g., 800px or 80vh)"
                        />
                        <TextControl
                            label="Width"
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                            help="Enter width (e.g., 100% or 1200px)"
                        />
                    </PanelBody>
                </InspectorControls>
                <div className="yakkt-configurator-block">
                    <div style={{ padding: '20px', background: '#f0f0f0', textAlign: 'center' }}>
                        <h3>Yakkt Campervan Configurator</h3>
                        <p>This block will display the 3D campervan configurator on the frontend.</p>
                        <p>Dimensions: {width} × {height}</p>
                    </div>
                </div>
            </Fragment>
        );
    },

    /**
     * The save function defines the way in which the different attributes should be combined
     * into the final markup, which is then serialized into post_content.
     * 
     * The "save" property must be specified and must be a valid function.
     * 
     * @param {Object} props - Block properties.
     * @returns {null} - Uses dynamic rendering, returns null.
     */
    save: function() {
        // Dynamic block, so return null
        return null;
    },
}); 