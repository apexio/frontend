define([
    '$',
    'utils/mediator',
    'bonzo',
    'bean',
    'qwery',
    'modules/detect',
    'modules/relativedates',
    'modules/facia/images',
    'modules/discussion/commentCount'
], function ($, mediator, bonzo, bean, qwery, detect, relativeDates, faciaImages, commentCount) {

    var buttonText = 'Show more',
        getInitialShowSize = function (collectionType) {
            var breakpointOptions = {
                wide: {
                    default: 4,
                    news: 5,
                    comment: 5,
                    features: 3
                },
                desktop: {
                    default: 4,
                    news: 5,
                    comment: 5,
                    features: 3
                },
                tablet: {
                    default: 3,
                    news: 6,
                    comment: 4,
                    features: 4
                },
                mobile: {
                    default: 2,
                    news: 5,
                    comment: 3,
                    features: 3,
                    popular: 5
                }
            }[detect.getBreakpoint()];
            return breakpointOptions[collectionType] || breakpointOptions['default'];
        },
        getShowMoreSize = function() {
            return {
                wide: 8,
                desktop: 8,
                tablet: 6,
                mobile: 5
            }[detect.getBreakpoint()];
        },
        showMore = function($collection, $extraItems, count, upgradeImages) {
            var $items = $extraItems.splice(0, count);
            if (!$items.length) {
                return;
            }
            // NOTE: wrapping in div so can be passed to commentCount, relativeDates, etc.
            var wrappedItems = bonzo(bonzo.create('<div></div>'))
                                   .append($items)[0];
            relativeDates.init(wrappedItems);
            commentCount.init(wrappedItems);
            if (upgradeImages === true) {
                faciaImages.upgrade(wrappedItems);
            }
            $collection.append($items);
        };

    return function(collection) {

        this._collection = collection;

        this._$collection = bonzo(collection);

        this._$button = bonzo(bonzo.create(
            '<button class="collection__show-more tone-background" data-link-name="' + buttonText + ' | 0">' +
                '<span class="i i-arrow-white-large">' +
                    buttonText +
                '</span>' +
            '</button>'
        ));

        this._$extraItems = bonzo.create(
            $('.collection--template', collection).html()
        );

        this._renderButton = function() {
            this._$collection.after(this._$button);
            var that = this;
            bean.on(this._$button[0], 'click', function() {
                that.showMore();
            });
            mediator.emitEvent('modules:collectionShowMore:renderButton', [this]);
        };

        this.addShowMore = function() {
            var initalShowSize = getInitialShowSize(this._$collection.parent().attr('data-type'));

            this._$collection.removeClass('js-collection--show-more');

            // remove extras from dom
            $('.collection--template', this._collection).remove();

            // if we are showing more items than necessary, store them
            var excess = qwery('.item:nth-child(n+' + (initalShowSize + 1) + ')', this._collection);
            this._$extraItems = excess.concat(this._$extraItems);
            bonzo(excess).remove();

            // if we are showing less items than necessary, show more
            showMore(this._$collection, this._$extraItems, initalShowSize - qwery('.item',this._collection).length, true);

            // add toggle button, if they are extra items left to show
            if (this._$extraItems.length) {
                this._renderButton();
            }
        };

        this.showMore = function() {
            // increment button counter
            var newDataAttr = this._$button.attr('data-link-name').replace(/^(.* | )(\d+)$/, function(match, prefix, count) {
                // http://nicolaasmatthijs.blogspot.co.uk/2009/05/missing-radix-parameter.html
                return prefix + (parseInt(count, 10) + 1);
            });
            this._$button.attr('data-link-name', newDataAttr);

            // show x more, depending on current breakpoint
            showMore(this._$collection, this._$extraItems, getShowMoreSize());

            if (this._$extraItems.length === 0) {
                var that = this;
                // listen to the clickstream, as happens later, before removing
                mediator.on('module:clickstream:click', function(clickSpec) {
                    if (qwery(clickSpec.target)[0] === that._$button[0]) {
                        that._$button.remove();
                    }
                });
            }
        };

        this.addExtraItems = function($items) {
            this._$extraItems.concat($items);
        };

    };

});