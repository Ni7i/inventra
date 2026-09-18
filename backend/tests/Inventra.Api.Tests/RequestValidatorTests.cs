using FluentAssertions;
using Inventra.Api.Dtos;
using Inventra.Api.Validation;

namespace Inventra.Api.Tests;

public class RequestValidatorTests
{
    [Fact]
    public void Create_product_rejects_blank_sku_and_negative_price()
    {
        var result = new CreateProductRequestValidator()
            .Validate(new CreateProductRequest(" ", "Widget", null, -1m, 0, 0, null));

        result.IsValid.Should().BeFalse();
        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo(["Sku", "UnitPrice"]);
    }

    [Fact]
    public void Create_order_requires_lines_positive_quantities_and_valid_tax_rate()
    {
        var validator = new CreateOrderRequestValidator();

        validator.Validate(new CreateOrderRequest(1, [], 0m)).IsValid.Should().BeFalse();
        validator.Validate(new CreateOrderRequest(1, [new(1, 0)], 0m)).IsValid.Should().BeFalse();
        validator.Validate(new CreateOrderRequest(1, [new(1, 1)], 1.5m)).IsValid.Should().BeFalse();
        validator.Validate(new CreateOrderRequest(1, [new(1, 2)], 0.081m)).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Register_rejects_unknown_role()
    {
        var result = new RegisterRequestValidator()
            .Validate(new RegisterRequest("new@inventra.local", "Secret!23", "New User", "Owner"));

        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.PropertyName == "Role");
    }
}
